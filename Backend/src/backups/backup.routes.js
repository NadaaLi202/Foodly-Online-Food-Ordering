import express from "express";
import { allowedTo, protectedRoutes } from "../modules/auth/auth.controller.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { runSystemBackup, restoreFromBackup, listBackups } from "./backup.service.js";
import { systemBackupModel } from "./backup.model.js";
import { getBackupReadStream, getSignedBackupUrl } from "./backup.storage.js";
import path from "path";
import { AppError } from "../utils/AppError.js";

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
        if (String(req.query.confirm || "").toLowerCase() !== "true") {
            return res.status(400).json({
                message: "Restore requires confirm=true query param",
            });
        }
        const { backupId } = req.params;
        const companyId = getScopedCompanyId(req);
        if (companyId) {
            const exists = await systemBackupModel
                .findOne({ _id: backupId, backupForCompanyId: companyId })
                .select("_id")
                .lean();
            if (!exists) {
                return res.status(404).json({ message: "Backup not found" });
            }
        }
        const wipe = String(req.query.wipe || "").toLowerCase() === "true";
        const result = await restoreFromBackup(backupId, { wipe });
        res.status(200).json({
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

        const stream = await getBackupReadStream(backup.storage, backup.filePath);
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

export const backupRouter = router;
