import mongoose from "mongoose";

const operationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                "stock add process",
                "inventory exchange process",
                "transfer process",
                "inventory operation"
            ],
            required: true
        },
        warehouse: {
            type: mongoose.Schema.Types.Mixed
        },
        date: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact"
        },
        // المرفقات
        attachments: [
            {
                type: String
            }
        ]
    },
    {
        timestamps: true
    }
);

operationSchema.index({ type: 1 });

export const operationModel =
    mongoose.models.Operation ||
    mongoose.model("Operation", operationSchema);
