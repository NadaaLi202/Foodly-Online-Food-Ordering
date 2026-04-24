import express from "express";
import {
    createTransaction,
    getAllTransactions,
    getOne,
    updateOne,
    deleteOne,
    downloadInvoicePDF
} from "./transaction.controller.js";
import Transaction from "./transaction.model.js";
import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadfiles.js";
import { protectedRoutes, requireResolvedPermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";
import { validation } from "../../middleware/validation.js";
import { transactionSchema } from "./transaction.validation.js";
import { AppError } from "../../utils/apperror.js";

const router = express.Router();
const RBAC_DEBUG_ENABLED = String(process.env.RBAC_DEBUG || "").toLowerCase() === "true";
const rbacDebugLog = (payload) => {
    if (!RBAC_DEBUG_ENABLED) return;
    try {
        console.log("[RBAC_DEBUG]", JSON.stringify(payload));
    } catch {
        console.log("[RBAC_DEBUG]", payload);
    }
};

// Middleware to parse JSON fields if they are sent as strings (e.g. from FormData)
const parseJsonFields = (fields) => (req, res, next) => {
    fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
            try {
                req.body[field] = JSON.parse(req.body[field]);
            } catch (e) {
                // Ignore parsing errors, let validation handle it
            }
        }
    });
    next();
};

router.use(protectedRoutes, applyCompanyFilter);

const resolveTransactionPermissionKey = (moduleName, documentType) => {
    if (moduleName === "sales") {
        return "sales_invoices";
    }
    if (moduleName === "purchases") {
        return "purchase_invoices";
    }
    return null;
};

const transactionPermission = (moduleName, documentType, action) =>
    requireResolvedPermission((req) => {
        const key = resolveTransactionPermissionKey(moduleName, documentType);
        const permission = key ? `${key}:${action}` : null;
        req.rbacResolvedModule = key;
        req.rbacResolvedAction = action;
        rbacDebugLog({
            stage: "transaction-static-resolve",
            path: req.originalUrl,
            method: req.method,
            moduleName,
            documentType,
            action,
            matchedPermissionKey: permission,
        });
        return permission;
    });

const transactionPermissionFromRecord = (action) =>
    requireResolvedPermission(async (req) => {
        const doc = await Transaction.findOne({ _id: req.params.id, ...req.companyFilter })
            .select("module documentType")
            .lean();
        if (!doc) {
            throw new AppError("Transaction not found", 404);
        }
        const key = resolveTransactionPermissionKey(doc.module, doc.documentType);
        const permission = key ? `${key}:${action}` : null;
        req.rbacResolvedModule = key;
        req.rbacResolvedAction = action;
        rbacDebugLog({
            stage: "transaction-record-resolve",
            path: req.originalUrl,
            method: req.method,
            transactionId: req.params.id,
            moduleName: doc.module,
            documentType: doc.documentType,
            action,
            matchedPermissionKey: permission,
        });
        return permission;
    });

// ================= SALES =================

// Sales Invoices
router.post("/sales/invoices", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items', 'payment']), validation(transactionSchema), applyCompanyFilter, transactionPermission("sales", "invoice", "add"), createTransaction("sales", "invoice"));
router.get("/sales/invoices", transactionPermission("sales", "invoice", "view"), getAllTransactions("sales", "invoice"));

// Sales Returns
router.post("/sales/returns", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items', 'payment']), validation(transactionSchema), applyCompanyFilter, transactionPermission("sales", "return", "add"), createTransaction("sales", "return"));
router.get("/sales/returns", transactionPermission("sales", "return", "view"), getAllTransactions("sales", "return"));

// Sales Quotations
router.post("/sales/quotations", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items', 'payment']), validation(transactionSchema), applyCompanyFilter, transactionPermission("sales", "quotation", "add"), createTransaction("sales", "quotation"));
router.get("/sales/quotations", transactionPermission("sales", "quotation", "view"), getAllTransactions("sales", "quotation"));


// ================= PURCHASES =================

// Purchase Invoices
router.post("/purchases/invoices", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items', 'payment']), validation(transactionSchema), applyCompanyFilter, transactionPermission("purchases", "invoice", "add"), createTransaction("purchases", "invoice"));
router.get("/purchases/invoices", transactionPermission("purchases", "invoice", "view"), getAllTransactions("purchases", "invoice"));

// Purchase Returns
router.post("/purchases/returns", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items', 'payment']), validation(transactionSchema), applyCompanyFilter, transactionPermission("purchases", "return", "add"), createTransaction("purchases", "return"));
router.get("/purchases/returns", transactionPermission("purchases", "return", "view"), getAllTransactions("purchases", "return"));

// Purchase Orders
router.post("/purchases/purchaseOrder", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items', 'payment']), validation(transactionSchema), applyCompanyFilter, transactionPermission("purchases", "purchaseOrder", "add"), createTransaction("purchases", "purchaseOrder"));
router.get("/purchases/purchaseOrder", transactionPermission("purchases", "purchaseOrder", "view"), getAllTransactions("purchases", "purchaseOrder"));


// Purchase Requests
router.post("/purchases/requests", uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items', 'payment']), validation(transactionSchema), applyCompanyFilter, transactionPermission("purchases", "request", "add"), createTransaction("purchases", "request"));
router.get("/purchases/requests", transactionPermission("purchases", "request", "view"), getAllTransactions("purchases", "request"));


// ================= SHARED (PDF download — must be before catch-all 404) =================
router.get("/:id/download", transactionPermissionFromRecord("view"), downloadInvoicePDF);
router.route("/:id")
    .get(transactionPermissionFromRecord("view"), getOne)
    .patch(uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]), parseJsonFields(['items', 'payment']), validation(transactionSchema), transactionPermissionFromRecord("edit"), updateOne)
    .delete(transactionPermissionFromRecord("delete"), deleteOne);

export default router;
