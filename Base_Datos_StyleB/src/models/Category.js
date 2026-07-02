import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String },
        imageURL: { type: String, default: "https://placehold.co/800x600.png" },
        parentCategory: { type: mongoose.Schema.Types.ObjectId, required: false, ref: "Category", default: null },
    }, 
    { timestamps: true },
);

const Category = mongoose.model("Category", categorySchema);

export default Category; 

