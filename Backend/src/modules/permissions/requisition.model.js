import mongoose from "mongoose";

const requisitionSchema = new mongoose.Schema(
    {
        number: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        warehouse: {
            type: mongoose.Schema.Types.Mixed, // Accepting both ObjectId and branch name for flexibility
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
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

export const requisitionModel = mongoose.model("Requisition", requisitionSchema);
