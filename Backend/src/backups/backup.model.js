import mongoose from "mongoose";

const systemBackupSchema = new mongoose.Schema(
    {
        backupDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        backupName: {
            type: String,
            trim: true,
        },
        backupNameJsonl: {
            type: String,
            trim: true,
        },
        backupNameZip: {
            type: String,
            trim: true,
        },
        backupForCompanyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            default: null,
        },
        format: {
            type: String,
            default: "jsonl",
        },
        storage: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        filePath: {
            type: String,
            trim: true,
        },
        jsonlPath: {
            type: String,
            trim: true,
        },
        zipPath: {
            type: String,
            trim: true,
        },
        fileSizeBytes: {
            type: Number,
            default: 0,
        },
        jsonlSizeBytes: {
            type: Number,
            default: 0,
        },
        zipSizeBytes: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["success", "failed", "in_progress"],
            default: "success",
        },
        error: {
            type: String,
            default: null,
        },
        collections: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        totalRecords: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const systemBackupModel = mongoose.model("SystemBackup", systemBackupSchema);
