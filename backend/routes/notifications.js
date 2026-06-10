const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

/**
 * @route GET /api/notifications/:customerId
 * @desc List notifications for a customer, newest first, with unread count.
 */
router.get('/:customerId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId).select('notifications');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const notifications = [...customer.notifications]
      .map((n) => (n.toObject ? n.toObject() : n))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = notifications.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0);
    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    console.error('Failed to fetch notifications:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

/**
 * @route PATCH /api/notifications/:customerId/read-all
 * @desc Mark every notification as read.
 */
router.patch('/:customerId/read-all', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    let touched = 0;
    customer.notifications.forEach((n) => {
      if (!n.isRead) {
        n.isRead = true;
        touched += 1;
      }
    });
    await customer.save();
    res.status(200).json({ message: 'All notifications marked as read', updated: touched });
  } catch (err) {
    console.error('Failed to mark all notifications read:', err);
    res.status(500).json({ message: 'Failed to mark all read' });
  }
});

/**
 * @route PATCH /api/notifications/:customerId/:notificationId/read
 * @desc Mark a single notification as read.
 */
router.patch('/:customerId/:notificationId/read', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const notification = customer.notifications.id(req.params.notificationId);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.isRead = true;
    await customer.save();
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Failed to mark notification read:', err);
    res.status(500).json({ message: 'Failed to mark notification read' });
  }
});

/**
 * @route DELETE /api/notifications/:customerId/:notificationId
 * @desc Remove a notification.
 */
router.delete('/:customerId/:notificationId', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const before = customer.notifications.length;
    customer.notifications.pull({ _id: req.params.notificationId });
    if (customer.notifications.length === before) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    await customer.save();
    res.status(200).json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Failed to delete notification:', err);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

module.exports = router;
