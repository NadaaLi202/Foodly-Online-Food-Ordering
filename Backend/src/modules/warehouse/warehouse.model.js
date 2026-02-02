import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
    {
        // اسم المستودع (مطلوب)
        name: {
            type: String,
            required: [true, "اسم المستودع مطلوب"],
            trim: true,
            unique: true
        },

        // الحساب (اختياري)
        account: {
            type: String,
            trim: true,
            default: ""
        },

        // الفروع (الفرع الرئيسي فقط)
        branch: {
            type: String,
            enum: ["main"],
            default: "main"
        },

        // المستخدمون المرتبطون بالمستودع
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Contact"
            }
        ]
    },
    {
        timestamps: true
    }
);

warehouseSchema.index({ name: 1 });

export const warehouseModel =
    mongoose.models.Warehouse ||
    mongoose.model("Warehouse", warehouseSchema);
