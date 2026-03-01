import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import readline from "readline";
import archiver from "archiver";
import unzipper from "unzipper";
import { systemBackupModel } from "./backup.model.js";
import { userModel } from "../modules/user/user.model.js";
import { roleModel } from "../modules/role/role.model.js";
import { companyModel } from "../modules/companies/company.model.js";
import { settingsModel } from "../modules/settings/settings.model.js";
import Contact from "../modules/contacts/contacts.model.js";
import { salesCustomerModel } from "../modules/customers/customers.model.js";
import { productModel } from "../modules/product/product.model.js";
import Invoice from "../modules/invoices/invoices.model.js";
import Payment from "../modules/payments/payments.model.js";
import { returnModel } from "../modules/returns/returns.model.js";
import { quoteModel } from "../modules/quotes/quotes.model.js";
import { warehouseModel } from "../modules/warehouse/warehouse.model.js";
import { categoryModel } from "../modules/category/category.model.js";
import { safeModel } from "../modules/Safes/safe.model.js";
import Transaction from "../modules/transaction/transaction.model.js";
import { operationModel } from "../modules/operations/operations.model.js";
import { inventoryOperationModel } from "../modules/inventoryOperation/inventoryOperation.model.js";
import { inventoryExchangeModel } from "../modules/inventoryExchange/inventoryExchange.model.js";
import { transferProcessModel } from "../modules/transferProcess/transferProcess.model.js";
import { stockAddModel } from "../modules/stockAdd/stockAdd.model.js";
import { stockAddItemModel } from "../modules/stockAdd/stockAddItem.model.js";
import { stockLogModel } from "../modules/stockLogs/stockLog.model.js";
import { requisitionModel } from "../modules/permissions/requisition.model.js";
import { branchModel } from "../modules/branch/branch.model.js";
import { chartOfAccountsModel } from "../modules/chartOfAccounts/chartOfAccounts.model.js";
import { costCenterModel } from "../modules/costCenters/costCenter.model.js";
import { expenseModel } from "../modules/Expenses/expense.model.js";
import { bankAccountModel } from "../modules/BankAccounts/bankAccount.model.js";
import { taxesModel } from "../modules/taxes/taxes.model.js";
import FinancialReceipt from "../modules/FinancialTransactions/models/financialReceipt.model.js";
import FinancialDisbursement from "../modules/FinancialTransactions/models/financialDisbursement.model.js";
import FinancialTransfer from "../modules/FinancialTransactions/models/financialTransfer.model.js";
import { apiClientModel } from "../modules/apiClient/apiClient.model.js";
import { activityModel } from "../modules/activity/activity.model.js";
import { codingModel } from "../modules/coding/coding.model.js";
import { partnerListModel } from "../modules/listOfPartners/listOfPartners.model.js";
import { dailyRestrictionModel } from "../modules/dailyRestrictions/dailyRestrictions.model.js";
import { zatcaModel } from "../modules/zatca/zatca.model.js";
import logErrorGlobal from "../utils/logError.js";

// Dynamic registry: add new models here to include in backups
const COLLECTION_REGISTRY = {
    users: userModel,
    roles: roleModel,
    companies: companyModel,
    settings: settingsModel,
    contacts: Contact,
    customers: salesCustomerModel,
    products: productModel,
    categories: categoryModel,
    warehouses: warehouseModel,
    branches: branchModel,
    invoices: Invoice,
    transactions: Transaction,
    payments: Payment,
    returns: returnModel,
    quotes: quoteModel,
    operations: operationModel,
    inventoryOperations: inventoryOperationModel,
    inventoryExchanges: inventoryExchangeModel,
    transferProcesses: transferProcessModel,
    stockAdds: stockAddModel,
    stockAddItems: stockAddItemModel,
    stockLogs: stockLogModel,
    requisitions: requisitionModel,
    chartOfAccounts: chartOfAccountsModel,
    costCenters: costCenterModel,
    financialReceipts: FinancialReceipt,
    financialDisbursements: FinancialDisbursement,
    financialTransfers: FinancialTransfer,
    expenses: expenseModel,
    bankAccounts: bankAccountModel,
    safes: safeModel,
    taxes: taxesModel,
    apiClients: apiClientModel,
    activities: activityModel,
    coding: codingModel,
    partnerLists: partnerListModel,
    dailyRestrictions: dailyRestrictionModel,
    zatca: zatcaModel,
};

import { uploadBackupToS3, getBackupReadStream, deleteBackupFromS3 } from "./backup.storage.js";

const BACKUP_RETENTION_DAYS = 30;
const BACKUP_DIR = process.env.BACKUP_DIR
    ? path.resolve(process.env.BACKUP_DIR)
    : path.resolve(process.cwd(), "backups", "system");
const BACKUP_FORMAT = "jsonl";
const ZIP_ENABLED = String(process.env.BACKUP_ZIP_ENABLED || "").toLowerCase() === "true";
const ZIP_KEEP_JSONL = String(process.env.BACKUP_ZIP_KEEP_JSONL || "").toLowerCase() === "true";
const STORAGE_TARGET = {
    type: "local",
    directory: BACKUP_DIR,
};

const log = (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[Backup] ${timestamp} - ${message}`, Object.keys(meta).length ? meta : "");
};

const logError = (message, err) => {
    const timestamp = new Date().toISOString();
    logErrorGlobal(`[Backup ERROR] ${timestamp} - ${message}`, err?.message || err);
};

const formatTimestampForFilename = (date) => {
    const iso = date.toISOString();
    return iso.replace(/[:.]/g, "-");
};

const ensureBackupDir = async () => {
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
};

const writeLine = (stream, obj) =>
    new Promise((resolve, reject) => {
        const line = `${JSON.stringify(obj)}\n`;
        if (!stream.write(line, "utf8")) {
            stream.once("drain", resolve);
        } else {
            resolve();
        }
        stream.once("error", reject);
    });

const zipFile = async (sourcePath, targetPath) => {
    await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(targetPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        output.on("close", resolve);
        output.on("error", reject);
        archive.on("error", reject);
        archive.pipe(output);
        archive.file(sourcePath, { name: path.basename(sourcePath) });
        archive.finalize();
    });
};

const maybeUnzipStream = async (backup, inputStream) => {
    if (backup.format !== "zip" && !String(backup.filePath || "").endsWith(".zip")) {
        return inputStream;
    }
    return inputStream.pipe(unzipper.ParseOne(/\.jsonl$/));
};

/**
 * Fetch all documents from a model using find({}).lean()
 * Works independently of applyCompanyFilter - no req context
 */
const backupCollectionStream = async (key, Model, stream, counters, companyId = null) => {
    let query = {};
    if (companyId) {
        if (Model?.schema?.path?.("companyId")) {
            query = { companyId };
        } else if (Model.modelName === "Company") {
            query = { _id: companyId };
        } else {
            // No company scope available; skip for company-scoped backups
            return;
        }
    }
    const cursor = Model.find(query).lean().cursor();
    for await (const doc of cursor) {
        counters.totalRecords += 1;
        counters.collectionCounts[key] = (counters.collectionCounts[key] || 0) + 1;
        await writeLine(stream, { _type: "doc", collection: key, doc });
    }
};

/**
 * Perform full system backup - all registered collections
 * Stores as JSONL file on disk
 */
export const runSystemBackup = async (options = {}) => {
    const startTime = Date.now();
    log("Backup started", { storage: STORAGE_TARGET });

    let filePath = null;
    let jsonlPath = null;
    let zipPath = null;
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error("Database not connected");
        }

        await ensureBackupDir();
        const backupDate = new Date();
        const timestamp = formatTimestampForFilename(backupDate);
        const companyTag = options.companyId ? `-company-${options.companyId}` : "-system";
        const backupNameJsonl = `backup-${timestamp}${companyTag}.jsonl`;
        jsonlPath = path.join(BACKUP_DIR, backupNameJsonl);

        const counters = {
            totalRecords: 0,
            collectionCounts: {},
        };

        const stream = fs.createWriteStream(jsonlPath, { encoding: "utf8" });
        await writeLine(stream, {
            _type: "meta",
            version: 1,
            backupDate: backupDate.toISOString(),
            format: BACKUP_FORMAT,
            collections: Object.keys(COLLECTION_REGISTRY),
        });

        for (const [key, Model] of Object.entries(COLLECTION_REGISTRY)) {
            try {
                await backupCollectionStream(key, Model, stream, counters, options.companyId || null);
                log(`Backed up ${key}: ${counters.collectionCounts[key] || 0} documents`);
            } catch (err) {
                logError(`Failed to backup collection: ${key}`, err);
            }
        }

        await new Promise((resolve, reject) => {
            stream.end();
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        let jsonlStats = await fs.promises.stat(jsonlPath);
        let zipStats = null;
        if (ZIP_ENABLED) {
            const backupNameZip = `backup-${timestamp}${companyTag}.zip`;
            zipPath = path.join(BACKUP_DIR, backupNameZip);
            await zipFile(jsonlPath, zipPath);
            zipStats = await fs.promises.stat(zipPath);
            if (!ZIP_KEEP_JSONL) {
                await fs.promises.unlink(jsonlPath);
                jsonlPath = null;
                jsonlStats = null;
            }
        }

        const primaryPath = zipPath || jsonlPath;
        const primaryName = path.basename(primaryPath);
        filePath = primaryPath;
        const stats = zipStats || jsonlStats;
        let uploadResult = { uploaded: false };
        try {
            uploadResult = await uploadBackupToS3(primaryPath, primaryName);
        } catch (err) {
            logError("S3 upload failed", err);
        }

        const backup = new systemBackupModel({
            backupDate,
            backupName: primaryName,
            backupNameJsonl: jsonlPath ? path.basename(jsonlPath) : null,
            backupNameZip: zipPath ? path.basename(zipPath) : null,
            backupForCompanyId: options.companyId || null,
            totalRecords: counters.totalRecords,
            format: zipPath ? "zip" : BACKUP_FORMAT,
            filePath: primaryPath,
            jsonlPath,
            zipPath,
            fileSizeBytes: stats ? stats.size : 0,
            jsonlSizeBytes: jsonlStats ? jsonlStats.size : 0,
            zipSizeBytes: zipStats ? zipStats.size : 0,
            storage: uploadResult.uploaded ? uploadResult.storage : STORAGE_TARGET,
            status: "success",
        });
        await backup.save();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log("Backup completed", {
            totalRecords: counters.totalRecords,
            durationSeconds: duration,
            backupId: backup._id.toString(),
            filePath: primaryPath,
            fileSizeBytes: stats ? stats.size : 0,
            storage: uploadResult.uploaded ? uploadResult.storage : STORAGE_TARGET,
        });

        return {
            backupId: backup._id,
            totalRecords: counters.totalRecords,
            duration: parseFloat(duration),
            filePath: primaryPath,
            fileSizeBytes: stats ? stats.size : 0,
            jsonlSizeBytes: jsonlStats ? jsonlStats.size : 0,
            zipSizeBytes: zipStats ? zipStats.size : 0,
            format: zipPath ? "zip" : BACKUP_FORMAT,
            storage: uploadResult.uploaded ? uploadResult.storage : STORAGE_TARGET,
        };
    } catch (err) {
        try {
            if (filePath && fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
            if (jsonlPath && fs.existsSync(jsonlPath)) {
                await fs.promises.unlink(jsonlPath);
            }
            if (zipPath && fs.existsSync(zipPath)) {
                await fs.promises.unlink(zipPath);
            }
        } catch {
            // noop
        }
        logError("Backup failed", err);
        throw err;
    }
};

/**
 * Delete backups older than retention period
 */
export const cleanupOldBackups = async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - BACKUP_RETENTION_DAYS);

    try {
        const oldBackups = await systemBackupModel.find({ backupDate: { $lt: cutoff } }).lean();
        let deletedCount = 0;
        for (const backup of oldBackups) {
            try {
                if (backup.filePath) {
                    await fs.promises.unlink(path.resolve(backup.filePath));
                }
                if (backup.jsonlPath && backup.jsonlPath !== backup.filePath) {
                    await fs.promises.unlink(path.resolve(backup.jsonlPath));
                }
                if (backup.zipPath && backup.zipPath !== backup.filePath) {
                    await fs.promises.unlink(path.resolve(backup.zipPath));
                }
                if (backup.storage?.type === "s3") {
                    await deleteBackupFromS3(backup.storage);
                }
                await systemBackupModel.deleteOne({ _id: backup._id });
                deletedCount += 1;
            } catch (err) {
                logError("Cleanup failed for backup", err);
            }
        }
        if (deletedCount > 0) {
            log(`Cleanup: deleted ${deletedCount} backup(s) older than ${BACKUP_RETENTION_DAYS} days`);
        }
    } catch (err) {
        logError("Cleanup failed", err);
    }
};

/**
 * Restore from a backup by ID
 * Safely restores collections - uses bulkWrite where possible
 */
export const restoreFromBackup = async (backupId, options = {}) => {
    const startTime = Date.now();
    log("Restore started", { backupId });

    try {
        const backup = await systemBackupModel.findById(backupId).lean();
        if (!backup) {
            throw new Error("Backup not found");
        }

        if (!backup.filePath && backup.storage?.type !== "s3") {
            throw new Error("Backup file not found for restore");
        }
        if (options.wipe === true) {
            log("Restore wipe requested", { backupId });
            for (const [key, Model] of Object.entries(COLLECTION_REGISTRY)) {
                try {
                    await Model.deleteMany({});
                    log(`Wiped collection ${key}`);
                } catch (err) {
                    logError(`Failed to wipe collection: ${key}`, err);
                }
            }
        }

        const inputStream = await getBackupReadStream(backup.storage, backup.filePath);
        const dataStream = await maybeUnzipStream(backup, inputStream);
        const rl = readline.createInterface({ input: dataStream, crlfDelay: Infinity });
        const batchSize = 500;
        const buffers = new Map();
        let totalRestored = 0;

        const flushBuffer = async (collection, Model) => {
            const ops = buffers.get(collection);
            if (!ops || ops.length === 0) return;
            await Model.bulkWrite(ops);
            totalRestored += ops.length;
            log(`Restored ${collection}: ${ops.length} documents`);
            buffers.set(collection, []);
        };

        for await (const line of rl) {
            if (!line || !line.trim()) continue;
            const payload = JSON.parse(line);
            if (payload._type !== "doc") continue;
            const collection = payload.collection;
            const doc = payload.doc;
            const Model = COLLECTION_REGISTRY[collection];
            if (!Model || !doc) continue;
            const id = doc._id ? new mongoose.Types.ObjectId(doc._id) : new mongoose.Types.ObjectId();
            const { _id, __v, ...rest } = doc;
            const op = {
                replaceOne: {
                    filter: { _id: id },
                    replacement: { _id: id, ...rest },
                    upsert: true,
                },
            };
            if (!buffers.has(collection)) buffers.set(collection, []);
            const arr = buffers.get(collection);
            arr.push(op);
            if (arr.length >= batchSize) {
                await flushBuffer(collection, Model);
            }
        }

        for (const [collection, ops] of buffers.entries()) {
            if (ops.length === 0) continue;
            const Model = COLLECTION_REGISTRY[collection];
            if (!Model) continue;
            await Model.bulkWrite(ops);
            totalRestored += ops.length;
            log(`Restored ${collection}: ${ops.length} documents`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log("Restore completed", { totalRestored, durationSeconds: duration });

        return { totalRestored, duration: parseFloat(duration) };
    } catch (err) {
        logError("Restore failed", err);
        throw err;
    }
};

/**
 * List backups (for admin UI)
 */
export const listBackups = async (limit = 20, companyId = null) => {
    const filter = companyId ? { backupForCompanyId: companyId } : {};
    const backups = await systemBackupModel
        .find(filter)
        .sort({ backupDate: -1 })
        .limit(limit)
        .select("backupDate totalRecords createdAt filePath fileSizeBytes storage format status backupName backupNameJsonl backupNameZip jsonlPath zipPath jsonlSizeBytes zipSizeBytes backupForCompanyId")
        .lean();
    return backups;
};
