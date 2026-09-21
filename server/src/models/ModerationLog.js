import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        'auto_flag',
        'report_flag',
        'manual_ban',
        'manual_unban',
        'restore_post',
        'restore_comment',
        'delete_post',
        'delete_comment',
        'reset_strikes',
        'report_dismissed',
        'report_override',
        'appeal_approved',
        'appeal_rejected',
      ],
      required: true,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null indicates automated system action
      index: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    targetComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    targetMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reason: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    contentType: {
      type: String,
      enum: ['post', 'comment', 'message', 'account_ban', 'user', 'unknown'],
      default: 'unknown',
    },
    contentSnippet: {
      type: String,
      default: '',
    },
    postTitle: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

moderationLogSchema.index({ createdAt: -1 });

export const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);

