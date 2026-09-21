import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { sendNotificationMail } from "../config/mail.js";

export async function createNotification({
  senderId,
  recipientId,
  type,
  postId,
  commentId = null,
  commentBody = "",
}) {
  try {
    if (!senderId || !recipientId || senderId.toString() === recipientId.toString()) {
      return null;
    }

    const [sender, recipient, post] = await Promise.all([
      User.findById(senderId).select("username avatar role").lean(),
      User.findById(recipientId).select("username email preferences").lean(),
      Post.findById(postId).select("title").lean(),
    ]);

    if (!sender || !recipient || !post) {
      return null;
    }

    const isReply = type === "reply";
    const message = isReply
      ? `${sender.username} replied to your comment on "${post.title}"`
      : `${sender.username} commented on your post "${post.title}"`;

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId,
      comment: commentId,
      message,
    });

    const emailAllowed =
      recipient.preferences?.emailNotifs !== false &&
      recipient.preferences?.replyNotifs !== false;

    if (emailAllowed && recipient.email) {
      sendNotificationMail({
        to: recipient.email,
        recipientUsername: recipient.username,
        senderUsername: sender.username,
        type,
        postTitle: post.title,
        commentBody,
        postId,
      }).catch((mailErr) => {
        console.error("[Notification Mail Error]", mailErr.message);
      });
    }

    return notification;
  } catch (err) {
    console.error("[Create Notification Error]", err.message);
    return null;
  }
}

/**
 * Creates system-level notifications (e.g. moderation reviews, strikes, report outcomes)
 */
export async function createSystemNotification({
  recipientId,
  type,
  message,
  postId = null,
  commentId = null,
}) {
  try {
    if (!recipientId) return null;

    const recipient = await User.findById(recipientId).select("username email preferences").lean();
    if (!recipient) return null;

    const notification = await Notification.create({
      recipient: recipientId,
      sender: null,
      type,
      post: postId || null,
      comment: commentId || null,
      message: String(message).trim(),
    });

    return notification;
  } catch (err) {
    console.error("[Create System Notification Error]", err.message);
    return null;
  }
}

export async function notifyAllAdmins({
  message,
  senderId = null,
  postId = null,
  commentId = null,
}) {
  try {
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    if (!admins || admins.length === 0) return [];

    const notifications = await Promise.all(
      admins
        .filter((a) => !senderId || a._id.toString() !== senderId.toString())
        .map((admin) =>
          Notification.create({
            recipient: admin._id,
            sender: senderId || null,
            type: "admin_alert",
            post: postId || null,
            comment: commentId || null,
            message: String(message).trim(),
          }).catch((err) => {
            console.error("[Admin Notify Error]", err.message);
            return null;
          })
        )
    );

    return notifications.filter(Boolean);
  } catch (err) {
    console.error("[Notify All Admins Error]", err.message);
    return [];
  }
}
