import mongoose from "mongoose";

const transferProcessSchema = new mongoose.Schema(
    {
        // ربط مباشر بـ Operation
        operation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Operation",
            required: true
        },

        // التاريخ
        date: {
            type: Date,
            default: Date.now
        },

        // المخزن (المستودع الرئيسي فقط)
        toWarehouse: {
            type: String,
            enum: ["main"],
            required: true
        },
          // المخزن (المستودع الرئيسي فقط)
        fromWarehouse: {
            type: String,
            enum: ["main"],
            required: true
        },

        // المنتج
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        // الكمية
        quantity: {
            type: Number,
            required: true,
            min: 0.01
        },

        // الوصف
        description: {
            type: String,
            trim: true,
            default: ""
        },

        // مرفقات
        attachments: [
            {
                type: String
            }
        ]
    },
    { timestamps: true }
);

export const transferProcessModel =
    mongoose.models.TransferProcess ||
    mongoose.model("TransferProcess", transferProcessSchema);
