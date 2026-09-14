import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Resource description is required"],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "cs-intro",
      index: true,
    },
    items: {
      type: [String],
      default: [],
    },
    links: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, default: "link" }, // doc, video, repo, link
      },
    ],
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

resourceSchema.index({ order: 1, createdAt: 1 });

export const Resource = mongoose.model("Resource", resourceSchema);
