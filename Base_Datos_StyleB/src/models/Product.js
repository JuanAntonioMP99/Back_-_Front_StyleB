import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        stock: { type: Number, default: 0 },
        imageURL: { type: String, required: true, default: "https://placehold.co/600x400" },
        // Imágenes ADICIONALES de galería: no incluyen imageURL, que sigue
        // siendo la imagen principal. La galería completa (imagen principal
        // + adicionales) se compone en el frontend como [imageURL, ...images].
        images: { type: [String], default: [] },
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    }, 
    { timestamps: true },
);

const Product = mongoose.model("Product", productSchema); 

export default Product;