import { Router } from 'express';
import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/unread-count', async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipient: req.user.id,
      read: false,
    });
    return res.json({ unreadCount });
  } catch (err) {
    console.error('[Chat Unread Count Error]', err);
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'username email avatar role communityRole')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = conversations.map((conv) => {
      const otherUser = (conv.participants || []).find(
        (p) => p._id.toString() !== req.user.id.toString()
      ) || null;

      const unreadCount = conv.unreadCounts?.[req.user.id.toString()] || 0;

      return {
        id: conv._id.toString(),
        otherUser: otherUser
          ? {
              id: otherUser._id.toString(),
              username: otherUser.username,
              avatar: otherUser.avatar || '',
              role: otherUser.role,
              communityRole: otherUser.communityRole || {},
            }
          : null,
        lastMessage: conv.lastMessage || null,
        unreadCount,
        updatedAt: conv.updatedAt,
      };
    });

    return res.json({ conversations: formatted });
  } catch (err) {
    console.error('[Chat Conversations Error]', err);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/with/:userId', async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (targetId === req.user.id.toString()) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself' });
    }

    const targetUser = await User.findById(targetId).select('username avatar role communityRole').lean();
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const senderUser = await User.findById(req.user.id).select('role communityRole').lean();
    const isSenderStaff = Boolean(senderUser && (senderUser.role === 'admin' || senderUser.communityRole?.isMember));
    const isTargetStaff = Boolean(targetUser.role === 'admin' || targetUser.communityRole?.isMember);

    if (!isSenderStaff && !isTargetStaff) {
      return res.status(403).json({
        error: 'Direct messaging is only available with community team members and administrators',
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, targetId] },
    }).populate('participants', 'username avatar role communityRole');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, targetId],
        unreadCounts: {
          [req.user.id.toString()]: 0,
          [targetId.toString()]: 0,
        },
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username avatar role communityRole');
    }

    const otherUser = (conversation.participants || []).find(
      (p) => p._id.toString() !== req.user.id.toString()
    ) || targetUser;

    return res.json({
      conversation: {
        id: conversation._id.toString(),
        otherUser: {
          id: otherUser._id?.toString() || targetId,
          username: otherUser.username,
          avatar: otherUser.avatar || '',
          role: otherUser.role,
          communityRole: otherUser.communityRole || {},
        },
        lastMessage: conversation.lastMessage || null,
        unreadCount: conversation.unreadCounts?.[req.user.id.toString()] || 0,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (err) {
    console.error('[Chat Get With User Error]', err);
    return res.status(500).json({ error: 'Failed to initialize conversation' });
  }
});

router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id,
    }).select('_id').lean();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    const [messages] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .limit(100)
        .lean(),
      Message.updateMany(
        { conversationId, recipient: req.user.id, read: false },
        { $set: { read: true } }
      ),
      Conversation.updateOne(
        { _id: conversationId },
        { $set: { [`unreadCounts.${req.user.id}`]: 0 } }
      ),
    ]);

    return res.json({
      messages: messages.map((m) => ({
        id: m._id.toString(),
        conversationId: m.conversationId.toString(),
        sender: m.sender.toString(),
        recipient: m.recipient.toString(),
        text: m.text,
        read: m.read,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Chat Get Messages Error]', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user.id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const recipientId = conversation.participants.find(
      (p) => p.toString() !== req.user.id.toString()
    );

    const message = await Message.create({
      conversationId: conversation._id,
      sender: req.user.id,
      recipient: recipientId,
      text: text.trim().slice(0, 2000),
      read: false,
    });

    conversation.lastMessage = {
      text: message.text,
      sender: req.user.id,
      createdAt: message.createdAt,
    };

    const currentRecipientUnread = conversation.unreadCounts?.get(recipientId.toString()) || 0;
    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }
    conversation.unreadCounts.set(recipientId.toString(), currentRecipientUnread + 1);
    conversation.updatedAt = new Date();
    await conversation.save();

    return res.status(201).json({
      message: {
        id: message._id.toString(),
        conversationId: message.conversationId.toString(),
        sender: message.sender.toString(),
        recipient: message.recipient.toString(),
        text: message.text,
        read: message.read,
        createdAt: message.createdAt,
      },
    });
  } catch (err) {
    console.error('[Chat Send Message Error]', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

router.put('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    await Message.updateMany(
      { conversationId, recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.unreadCounts) {
      conversation.unreadCounts.set(req.user.id.toString(), 0);
      await conversation.save();
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[Chat Mark Read Error]', err);
    return res.status(500).json({ error: 'Failed to mark messages read' });
  }
});

export default router;
