const mongoose = require('mongoose');

// Schema for individual items inside the cart
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1.']
  },
  // Storing the price at the time of adding helps render the cart easily,
  // though you should always recalculate during checkout to ensure accuracy.
  price: {
    type: Number,
    required: true
  }
});

// Main Cart Schema
const cartSchema = new mongoose.Schema({
  // For logged-in users
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null 
  },
  // For guest users (Req #4)
  sessionId: {
    type: String,
    default: null
  },
  items: [cartItemSchema],
  cartTotal: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});

// 🧮 Pre-save hook: Automatically calculate cartTotal before saving
cartSchema.pre('save', function (next) {
  this.cartTotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

// 🤝 Static Method: Merge guest cart into user cart on login
cartSchema.statics.mergeCarts = async function (sessionId, customerId) {
  // 1. Find the guest cart
  const guestCart = await this.findOne({ sessionId, customerId: null });
  
  // If no guest cart exists or it's empty, there is nothing to merge
  if (!guestCart || guestCart.items.length === 0) return;

  // 2. Find the logged-in user's cart
  let userCart = await this.findOne({ customerId });

  if (!userCart) {
    // 3. Scenario A: User has no saved cart. Just convert the guest cart to a user cart!
    guestCart.customerId = customerId;
    guestCart.sessionId = null; // Clean up the session ID
    return await guestCart.save();
  }

  // 4. Scenario B: User has a saved cart. We need to merge them.
  for (const guestItem of guestCart.items) {
    const existingItemIndex = userCart.items.findIndex(
      (item) => item.product.toString() === guestItem.product.toString()
    );

    if (existingItemIndex > -1) {
      userCart.items[existingItemIndex].quantity += guestItem.quantity;
    } else {
      userCart.items.push(guestItem);
    }
  }

  await userCart.save(); // The pre-save hook will automatically update the cartTotal!
  await this.deleteOne({ _id: guestCart._id }); // Delete the old guest cart
  
  return userCart;
};

// 🛒 Instance Method: Add an item to the cart
cartSchema.methods.addItem = async function (productId, quantity, price) {
  const existingItemIndex = this.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    this.items.push({ product: productId, quantity, price });
  }

  return this.save();
};

// 🗑️ Instance Method: Remove an item from the cart
cartSchema.methods.removeItem = async function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// 🔄 Instance Method: Update item quantity
cartSchema.methods.updateQuantity = async function (productId, quantity) {
  if (quantity <= 0) return this.removeItem(productId);

  const itemIndex = this.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    this.items[itemIndex].quantity = quantity;
    return this.save();
  }
  
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);