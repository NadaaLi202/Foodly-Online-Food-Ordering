import express from "express";
import fs from "fs";
import multer from "multer";
import { Readable } from "stream";
import { allowedTo, protectedRoutes } from "../modules/auth/auth.controller.js";
import { catchAsyncError } from "../middleware/catchasyncerror.js";
import { runSystemBackup, restoreFromBackup, restoreFromStream, listBackups } from "./backup.service.js";
import { systemBackupModel } from "./backup.model.js";
import { getBackupReadStream, getSignedBackupUrl } from "./backup.storage.js";
import path from "path";
import { AppError } from "../utils/apperror.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === ".jsonl" || ext === ".json" || file.mimetype === "application/json" || file.mimetype === "application/octet-stream") {
            return cb(null, true);
        }
        cb(new Error("Only JSONL backup files are accepted"));
    }
});

const router = express.Router();

// All routes require auth; allow superAdmin or company owner
router.use(protectedRoutes);
router.use((req, res, next) => {
    const role = req.user?.role;
    const systemRole = req.user?.systemRole;
    const isSuperAdmin = role === "superAdmin" || systemRole === "superAdmin";
    const isCompanyOwner = role === "company" || systemRole === "companyOwner";
    if (isSuperAdmin || isCompanyOwner) return next();
    return next(new AppError("Forbidden", 403));
});

const getScopedCompanyId = (req) => {
    const role = req.user?.role;
    const systemRole = req.user?.systemRole;
    const isSuperAdmin = role === "superAdmin" || systemRole === "superAdmin";
    if (isSuperAdmin) {
        return req.query.companyId ? String(req.query.companyId) : null;
    }
    return req.user?.companyId ? String(req.user.companyId) : null;
};

router.post(
    "/system",
    catchAsyncError(async (req, res) => {
        const companyId = getScopedCompanyId(req);
        const result = await runSystemBackup({ companyId });
        res.status(201).json({
            message: "Backup completed successfully",
            backupId: result.backupId,
            totalRecords: result.totalRecords,
            durationSeconds: result.duration,
            storage: result.storage,
            filePath: result.filePath,
            fileSizeBytes: result.fileSizeBytes,
            jsonlSizeBytes: result.jsonlSizeBytes,
            zipSizeBytes: result.zipSizeBytes,
            format: result.format,
        });
    })
);

router.get(
    "/",
    catchAsyncError(async (req, res) => {
        const limit = parseInt(req.query.limit, 10) || 20;
        const companyId = getScopedCompanyId(req);
        const backups = await listBackups(limit, companyId);
        res.status(200).json({ message: "Backups listed", backups });
    })
);

router.post(
    "/restore/:backupId",
    catchAsyncError(async (req, res) => {
        console.log("[Restore] handler called", req.params, req.query);
        if (String(req.query.confirm || "").toLowerCase() !== "true") {
            return res.status(400).json({
                message: "Restore requires confirm=true query param",
            });
        }
        console.log("[Restore] confirm=true OK");

        const { backupId } = req.params;
        console.log("[Restore] backupId:", backupId);

        const companyId = getScopedCompanyId(req);
        console.log("[Restore] companyId:", companyId);

        if (companyId) {
            // Allow restore if the backup belongs to this company OR is a system backup (no company scope)
            const exists = await systemBackupModel
                .findOne({
                    _id: backupId,
                    $or: [
                        { backupForCompanyId: companyId },
                        { backupForCompanyId: null },
                        { backupForCompanyId: { $exists: false } },
                    ],
                })
                .select("_id backupForCompanyId")
                .lean();
            console.log("[Restore] DB lookup result:", exists);
            if (!exists) {
                console.log("[Restore] Backup not found or access denied");
                return res.status(404).json({ message: "Backup not found" });
            }
        }

        const wipe = String(req.query.wipe || "").toLowerCase() === "true";
        console.log("[Restore] wipe:", wipe);

        console.log("[Restore] calling restoreFromBackup...");
        const result = await restoreFromBackup(backupId, { wipe, companyId });
        console.log("[Restore] restoreFromBackup done", result);
        res.status(200).json({
            success: true,
            message: "Restore completed successfully",
            totalRestored: result.totalRestored,
            durationSeconds: result.duration,
        });
    })
);

router.get(
    "/download/:backupId",
    catchAsyncError(async (req, res) => {
        const { backupId } = req.params;
        const companyId = getScopedCompanyId(req);
        const query = companyId
            ? { _id: backupId, backupForCompanyId: companyId }
            : { _id: backupId };
        const backup = await systemBackupModel.findOne(query).lean();
        if (!backup) {
            return res.status(404).json({ message: "Backup not found" });
        }

        if (backup.storage?.type === "s3" && String(process.env.BACKUP_S3_DOWNLOAD_MODE || "").toLowerCase() === "signed") {
            const url = await getSignedBackupUrl(backup.storage);
            if (!url) {
                return res.status(404).json({ message: "Backup file not available in S3" });
            }
            return res.redirect(302, url);
        }

        // Rebuild path from filename only — the stored absolute path may be from a different machine.
        let resolvedFilePath = backup.filePath || null;
        if (resolvedFilePath && backup.storage?.type !== "s3") {
            const filename = path.basename(resolvedFilePath);
            resolvedFilePath = path.join(process.cwd(), "backups", "system", filename);
        }

        // Check the file exists locally before streaming it.
        if (backup.storage?.type !== "s3" && resolvedFilePath && !fs.existsSync(resolvedFilePath)) {
            return res.status(404).json({
                message: "Backup file is not available on this machine. It was created on a different server and has not been transferred here."
            });
        }

        const stream = await getBackupReadStream(backup.storage, resolvedFilePath);
        const filename = backup.backupName || path.basename(backup.filePath || `backup-${backupId}.jsonl`);
        const isZip = backup.format === "zip" || String(filename).endsWith(".zip");
        res.setHeader("Content-Type", isZip ? "application/zip" : "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        stream.on("error", () => {
            res.status(404).json({ message: "Backup file not found" });
        });
        stream.pipe(res);
    })
);



router.post(
    "/restore-from-file",
    upload.single("backupFile"),
    catchAsyncError(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: "No backup file uploaded" });
        }
        if (String(req.query.confirm || "").toLowerCase() !== "true") {
            return res.status(400).json({ message: "Restore requires confirm=true query param" });
        }
        const wipe = String(req.query.wipe || "").toLowerCase() === "true";
        const companyId = getScopedCompanyId(req);
        
        console.log("[Restore-from-file] handler called", { wipe, companyId });

        console.log("[Restore-from-file] calling restoreFromStream...");
        const result = await restoreFromStream(req.file.buffer, { wipe, companyId });
        console.log("[Restore-from-file] restoreFromStream done", result);
        res.status(200).json({
            message: "Restore from file completed successfully",
            totalRestored: result.totalRestored,
            durationSeconds: result.duration,
        });
    })
);

export const backupRouter = router;
