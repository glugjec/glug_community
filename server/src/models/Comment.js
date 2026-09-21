import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    body: {
      type: String,
      required: [true, 'Comment body is required'],
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    voteScore: {
      type: Number,
      default: 0,
    },
    votes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        value: {
          type: Number,
          required: true,
          enum: [1, -1],
        },
      },
    ],
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    moderationReason: {
      type: String,
      default: '',
    },
    moderationCategory: {
      type: String,
      default: '',
    },
    hiddenAt: {
      type: Date,
      default: null,
    },
    moderationSkipped: {
      type: Boolean,
      default: false,
      index: true,
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

commentSchema.index({ post: 1, createdAt: 1 });

export const Comment = mongoose.model('Comment', commentSchema);

