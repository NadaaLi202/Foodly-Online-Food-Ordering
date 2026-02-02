import mongoose from "mongoose";

const stockAddSchema = new mongoose.Schema(
    {
        // ربط مع Operation
        operation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Operation",
            required: true
        },

        // التاريخ
        date: {
            type: Date,
            required: true,
            default: Date.now
        },

        // الحساب (خزنة / بنك)
        account: {
            type: String,
            required: true,
            trim: true
        },

        // المخزن
        warehouse: {
            type: String,
            enum: ["main", "secondary"],
            required: true
        },

        // إجمالي العملية (محسوب من البنود)
        totalAmount: {
            type: Number,
            default: 0
        },

        // الوصف
        description: {
            type: String,
            trim: true,
            default: ""
        },

        // مرفقات (اختياري)
        attachments: [
            {
                type: String
            }
        ],

        // تم بواسطة
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact"
        }
    },
    {
        timestamps: true
    }
);

export const stockAddModel = mongoose.model("StockAdd", stockAddSchema);
