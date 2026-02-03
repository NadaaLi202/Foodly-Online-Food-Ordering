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
            enum: ["main", "secondary"],
            default: "main"
        },

        // المستخدمون المرتبطون بالمستودع
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Contact"
            }
        ],

        enableReceiving: {
            type: Boolean,
            default: false
        },

        enableIssuing: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);



export const warehouseModel =
    mongoose.models.Warehouse ||
    mongoose.model("Warehouse", warehouseSchema);
