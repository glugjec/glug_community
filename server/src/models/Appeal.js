import mongoose from "mongoose";

const appealSchema = new mongoose.Schema(
  {
    appellant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ["post", "comment", "message", "strike"],
      default: "strike",
      required: true,
    },
    targetPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    targetComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    targetMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    moderationLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModerationLog",
      default: null,
    },
    strikeIndex: {
      type: Number,
      default: 1,
    },
    originalReason: {
      type: String,
      default: "",
    },
    originalCategory: {
      type: String,
      default: "",
    },
    statement: {
      type: String,
      required: [true, "Please provide an appeal statement"],
      trim: true,
      maxlength: [1500, "Appeal statement cannot exceed 1500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

appealSchema.index({ appellant: 1, status: 1 });
appealSchema.index({ status: 1, createdAt: -1 });

export const Appeal = mongoose.model("Appeal", appealSchema);
