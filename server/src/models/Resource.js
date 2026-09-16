import mongoose from "mongoose";

const fileLinkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
      maxlength: [150, "File name cannot exceed 150 characters"],
    },
    url: {
      type: String,
      required: [true, "File download link URL is required"],
      trim: true,
    },
    format: {
      type: String,
      enum: ["pdf", "zip", "iso", "epub", "code", "slides", "doc", "archive", "other"],
      default: "other",
      lowercase: true,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true }
);

const resourceLinkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Link title is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Link URL is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["course", "book", "doc", "repo", "video", "interactive", "tool", "link"],
      default: "link",
    },
  },
  { _id: true }
);

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Resource title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Resource description is required"],
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "cs-intro",
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["all-levels", "beginner", "intermediate", "advanced"],
      default: "all-levels",
      index: true,
    },
    items: {
      type: [String],
      default: [],
    },
    links: {
      type: [resourceLinkSchema],
      default: [],
    },
    files: {
      type: [fileLinkSchema],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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

resourceSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

resourceSchema.index({ order: 1, createdAt: -1 });
resourceSchema.index({ category: 1, difficulty: 1 });
resourceSchema.index({ "files.0": 1 });

export const Resource = mongoose.model("Resource", resourceSchema);
