import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [250, 'Title cannot exceed 250 characters'],
    },
    body: {
      type: String,
      required: [true, 'Post content is required'],
    },
    category: {
      type: String,
      enum: [
        'general',
        'help',
        'linux',
        'installation',
        'command-line',
        'programming',
        'open-source',
        'tools-apps',
        'projects',
        'events',
        'resources',
        'careers',
      ],
      default: 'general',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    voteScore: {
      type: Number,
      default: 0,
      index: true,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
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

postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ voteScore: -1, createdAt: -1 });
postSchema.index({ isPinned: -1, createdAt: -1 });
postSchema.index({ isPinned: -1, voteScore: -1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

export const Post = mongoose.model('Post', postSchema);

