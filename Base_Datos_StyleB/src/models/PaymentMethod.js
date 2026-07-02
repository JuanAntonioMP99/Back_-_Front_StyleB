import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                "credit_card",
                "debit_card",
                "paypal",
                "bank_transfer",
                "cash_on_delivery",
            ],
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        numCard: {
            type: String,
            required: true,
            max: 16,
            trim: true,
        },
        dueDate: {
            type: String,
            required: true,
            trim: true,
        },
        cvv: {
            type: String,
            required: true,
            max: 3,
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const PaymentMethod = mongoose.model("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;