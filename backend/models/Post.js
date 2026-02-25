import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    authorName: { type: String, required: true },
    authorEmail: { type: String },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });

const postSchema = new mongoose.Schema({
    authorName: { type: String, required: true },
    authorEmail: { type: String },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, default: "General" },
    comments: [commentSchema],
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isEdited: { type: Boolean, default: false }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

postSchema.virtual('likes').get(function () {
    return this.likedBy ? this.likedBy.length : 0;
});

const Post = mongoose.models.Post || mongoose.model("Post", postSchema);
export default Post;
