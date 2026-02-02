import mongoose from "mongoose";

const operationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                "stock add process",
                "inventory exchange process",
                "transfer process"
            ],
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contact"
        }
    },
    {
        timestamps: true
    }
);

operationSchema.index({ type: 1 });

export const operationModel =
    mongoose.models.Operation ||
    mongoose.model("Operation", operationSchema);
