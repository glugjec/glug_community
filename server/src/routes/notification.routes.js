import { Router } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const recipientId = new mongoose.Types.ObjectId(req.user.id);
    const notifications = await Notification.find({ recipient: recipientId })
      .select('type message isRead createdAt sender post comment')
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender', 'username avatar role')
      .populate('post', 'title')
      .lean();

    const formatted = notifications.map((n) => ({
      id: n._id.toString(),
      _id: n._id.toString(),
      type: n.type,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
      sender: n.sender
        ? {
            id: n.sender._id?.toString(),
            username: n.sender.username,
            avatar: n.sender.avatar,
            role: n.sender.role,
          }
        : null,
      post: n.post
        ? {
            id: n.post._id?.toString(),
            title: n.post.title,
          }
        : null,
      commentId: n.comment ? n.comment.toString() : null,
    }));

    res.set('Cache-Control', 'private, no-cache');
    return res.json({ notifications: formatted });
  } catch (err) {
    console.error('[Get Notifications Error]', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const recipientId = new mongoose.Types.ObjectId(req.user.id);
    const unreadCount = await Notification.countDocuments({
      recipient: recipientId,
      isRead: false,
    });
    return res.json({ unreadCount });
  } catch (err) {
    console.error('[Get Unread Notification Count Error]', err);
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

router.put('/read-all', requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[Mark All Read Error]', err);
    return res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ success: true, notification: updated });
  } catch (err) {
    console.error('[Mark Read Error]', err);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
