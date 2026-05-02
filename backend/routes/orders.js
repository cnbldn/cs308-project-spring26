const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const { sendInvoiceEmail } = require('../utils/emailService');

const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Helper to generate PDF Buffer for Emails & Downloads
const generateInvoicePDFBuffer = (invoice) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
        doc.on('error', reject);

        // Header
        doc.fillColor('#444444').fontSize(20).text('GAME VAULT INVOICE', { align: 'center' });
        doc.fontSize(10).text(`Issued on: ${new Date(invoice.issuedAt).toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();

        // Customer Details
        doc.fontSize(12).fillColor('black');
        doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 160);
        doc.text(`Bill To: ${invoice.customer?.name || 'Customer'}`, 50, 175);
        doc.text(`Address: ${invoice.billingAddress}`, 50, 190);
        if (invoice.customer?.taxId) doc.text(`Tax ID: ${invoice.customer.taxId}`, 50, 205);

        // Table Header
        const tableTop = 250;
        doc.font('Helvetica-Bold').text('Product', 50, tableTop);
        doc.text('Qty', 350, tableTop);
        doc.text('Total', 450, tableTop);
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table Rows
        doc.font('Helvetica');
        let currentY = tableTop + 30;
        invoice.items.forEach(item => {
            doc.text(item.name, 50, currentY);
            doc.text(item.quantity.toString(), 350, currentY);
            doc.text(`$${item.lineTotal.toFixed(2)}`, 450, currentY);
            currentY += 25;
        });

        // Total
        doc.moveTo(50, currentY + 10).lineTo(550, currentY + 10).stroke();
        doc.font('Helvetica-Bold').fontSize(14).text(`TOTAL: $${invoice.totalAmount.toFixed(2)}`, 350, currentY + 30);

        doc.fontSize(10).font('Helvetica').fillColor('grey').text('Payment confirmed (Mock entity).', 50, 700, { align: 'center' });
        
        doc.end();
    });
};

// POST /api/orders/checkout
// Requirement #4 (Orders) & #3 (Stock Decrement)
router.post('/checkout', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customerId, deliveryAddress, billingEmail, mockPaymentReference } = req.body;

        if (!customerId || !deliveryAddress || !billingEmail) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // 1. Verify and Populate Cart
        const cart = await Cart.findOne({ customerId }).populate('items.product').session(session);
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty." });
        }

        const orderItems = [];
        let subtotal = 0;

        // 2. Validate Stock and Prepare Order Data
        for (const cartItem of cart.items) {
            // Skip "ghost" products that no longer exist in the DB
            if (!cartItem.product) continue;

            const product = await Product.findById(cartItem.product._id).session(session);
            
            if (!product) {
                throw new Error(`Product ${cartItem.product.name} not found.`);
            }

            // Requirement #3: Check stock
            if (product.stock < cartItem.quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Only ${product.stock} left.`);
            }

            // Requirement #3: Decrement stock
            product.stock -= cartItem.quantity;
            await product.save({ session });

            const lineTotal = product.price * cartItem.quantity;
            subtotal += lineTotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                model: product.model,
                serialNumber: product.serialNumber,
                quantity: cartItem.quantity,
                unitPrice: product.price,
                lineTotal: lineTotal
            });
        }

        // 3. Create Order document
        const order = new Order({
            customer: customerId,
            items: orderItems,
            subtotal: subtotal,
            totalAmount: subtotal,
            deliveryAddress: deliveryAddress,
            mockPaymentReference: mockPaymentReference || `MOCK-${Date.now()}`
        });
        await order.save({ session });

        // 4. Create Invoice document
        const invoice = new Invoice({
            invoiceNumber: `INV-${Date.now()}`,
            order: order._id,
            customer: customerId,
            billingEmail: billingEmail,
            billingAddress: deliveryAddress,
            items: orderItems,
            subtotal: subtotal,
            totalAmount: subtotal,
            emailStatus: 'mock-sent'
        });
        await invoice.save({ session });

        // 5. Clear user's cart
        cart.items = [];
        cart.cartTotal = 0;
        await cart.save({ session });

        await session.commitTransaction();
        session.endSession();

        // 6. Generate PDF and Send Email (Requirement #4)
        // We do this after the transaction to ensure the DB state is solid.
        // We use a separate try/catch so email failure doesn't break the response.
        try {
            const populatedInvoice = await Invoice.findById(invoice._id).populate('customer', 'name taxId');
            const pdfBuffer = await generateInvoicePDFBuffer(populatedInvoice);
            
            await sendInvoiceEmail(billingEmail, invoice.invoiceNumber, pdfBuffer);
            
            // Update email status in DB
            await Invoice.findByIdAndUpdate(invoice._id, { emailStatus: 'sent' });
            invoice.emailStatus = 'sent';
        } catch (emailErr) {
            console.error("[CHECKOUT EMAIL ERROR]", emailErr);
            await Invoice.findByIdAndUpdate(invoice._id, { emailStatus: 'failed' });
            invoice.emailStatus = 'failed';
        }

        res.status(201).json({
            message: "Order placed successfully!",
            orderId: order._id,
            invoiceId: invoice._id,
            invoice: invoice
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("Checkout Failed:", err);
        res.status(400).json({ message: err.message });
    }
});

// GET /api/orders
// Requirement #12: For managers to view all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('customer', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/orders/invoice/:invoiceId/pdf
// Requirement #4: Generate and stream the PDF
router.get('/invoice/:invoiceId/pdf', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.invoiceId).populate('customer', 'name taxId');
        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        const pdfBuffer = await generateInvoicePDFBuffer(invoice);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error("PDF generation error:", err);
        res.status(500).json({ message: "Failed to generate PDF" });
    }
});

// GET /api/orders/history/:customerId
// Allows users to see their order history (Required for Requirement #3)
router.get('/history/:customerId', async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.params.customerId })
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/orders/:id/status
// Requirement #3 (Tracking) & #12 (Managerial tasks)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'processing', 'in-transit', 'delivered'

        const validStatuses = ['processing', 'in-transit', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        order.orderStatus = status;
        order.statusHistory.push({ status, changedAt: new Date() });

        await order.save();

        res.status(200).json({ 
            message: `Order status updated to ${status}`,
            order 
        });
    } catch (err) {
        console.error("[STATUS UPDATE ERROR]", err);
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/orders/:id/cancel
// Requirement #13: Allow customers to cancel orders + return items to stock
router.patch('/:id/cancel', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        const order = await Order.findById(id).session(session);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Only allow cancellation if order is still 'processing'
        if (order.orderStatus !== 'processing') {
            return res.status(400).json({ message: `Cannot cancel an order that is already ${order.orderStatus}.` });
        }

        // 1. Return items to stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } },
                { session }
            );
        }

        // 2. Update Order status
        order.orderStatus = 'cancelled';
        order.statusHistory.push({ status: 'cancelled', changedAt: new Date() });
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: "Order cancelled successfully and items returned to stock.", order });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error("[CANCELLATION ERROR]", err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
