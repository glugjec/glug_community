import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['post', 'comment', 'message'],
      required: true,
      index: true,
    },
    targetPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
      index: true,
    },
    targetComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    targetMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
      index: true,
    },
    targetAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'dismissed'],
      default: 'pending',
      index: true,
    },
    aiVerdict: {
      type: String,
      enum: ['VIOLATION', 'SAFE', 'pending'],
      default: 'pending',
    },
    aiReason: {
      type: String,
      default: '',
    },
    aiCategory: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
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

// Prevent duplicate reports on same target by same reporter
reportSchema.index(
  { reporter: 1, targetPost: 1, targetComment: 1, targetMessage: 1 },
  { unique: true, partialFilterExpression: { reporter: { $exists: true } } }
);

export const Report = mongoose.model('Report', reportSchema);

