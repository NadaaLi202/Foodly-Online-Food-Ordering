import mongoose from "mongoose";

const requisitionSchema = new mongoose.Schema(
    {
        number: {
            type: String,
            required: true,
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
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        }
    },
    {
        timestamps: true
    }
);

requisitionSchema.index({ number: 1, companyId: 1 }, { unique: true });

export const requisitionModel = mongoose.model("Requisition", requisitionSchema);
