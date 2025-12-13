import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },

    // Reaction System (like/dislike)
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],

    // Edit Tracking
    isEdited: { type: Boolean, default: false },
    editHistory: [
      {
        previousText: String,
        editedAt: { type: Date, default: Date.now },
      },
    ],

    // Reporting System
    status: {
      type: String,
      enum: ["active", "hidden", "deleted"],
      default: "active",
    },
    reportCount: { type: Number, default: 0 },
    reportedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        reportedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// -------------------------------
// Virtual Fields
// -------------------------------
commentSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

commentSchema.virtual("dislikeCount").get(function () {
  return this.dislikes.length;
});

commentSchema.virtual("score").get(function () {
  return this.likes.length - this.dislikes.length;
});

// -------------------------------
// Indexes for Performance
// -------------------------------
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

// -------------------------------
// Edit History Middleware
// -------------------------------
commentSchema.pre("save", function (next) {
  if (this.isModified("text") && !this.isNew) {
    this.isEdited = true;
    this.editHistory.push({
      previousText: this.text,
      editedAt: new Date(),
    });
  }
  next();
});

// -------------------------------
// Pagination Method
// -------------------------------
commentSchema.statics.getComments = async function (
  postId,
  page = 1,
  limit = 10,
  sort = "newest"
) {
  const skip = (page - 1) * limit;

  let sortOptions = {};
  switch (sort) {
    case "oldest":
      sortOptions = { createdAt: 1 };
      break;
    case "mostLiked":
      sortOptions = { likeCount: -1, createdAt: -1 };
      break;
    default:
      sortOptions = { createdAt: -1 };
  }

  const comments = await this.find({
    post: postId,
    parentComment: null,
    status: "active",
  })
    .sort(sortOptions)
    .skip(skip)
    .limit(limit)
    .populate("author", "fullName avatar role")
    .lean();

  const total = await this.countDocuments({
    post: postId,
    parentComment: null,
    status: "active",
  });

  return {
    comments,
    pagination: {
      page,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

export default mongoose.model("Comment", commentSchema);
