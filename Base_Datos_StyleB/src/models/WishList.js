import mongoose from "mongoose";

const wishListSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, ],
    }, 
    { timestamps: true },
);

const WishList = mongoose.model("WishList", wishListSchema);

export default WishList; 

