// عمليات الجرد  


import mongoose from "mongoose";

const inventoryOperationSchema = new mongoose.Schema(
    {
        // المخزن المرتبط بالعملية (مطلوب)
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: [true, "المخزن مطلوب"]
        },

        // المستودع الرئيسي (اختياري، افتراضي "main")
        mainBranch: {
            type: String,
            enum: ["main"],
            default: "main"
        },

        // التاريخ (مطلوب)
        date: {
            type: Date,
            required: [true, "التاريخ مطلوب"],
            default: Date.now
        },

        // الوصف (اختياري)
        description: {
            type: String,
            trim: true,
            default: ""
        }
    },
    { timestamps: true }
);

// index لتحسين البحث
inventoryOperationSchema.index({ warehouse: 1, date: -1 });

export const inventoryOperationModel =
    mongoose.models.InventoryOperation ||
    mongoose.model("InventoryOperation", inventoryOperationSchema);
