import express from "express";
import {
    createFinancialTransaction,
    getAllFinancialTransactions,
    getOneTransaction,
    updateFinancialTransaction,
    deleteFinancialTransaction
} from "./financialTransaction.controller.js";
import { uploadMultiFiles, ATTACHMENT_MIMETYPES } from "../../middleware/uploadFiles.js";
import { protectedRoutes, requireResourcePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";
import { validation } from "../../middleware/validation.js";
import { receiptSchema, disbursementSchema, transferSchema } from "./financialTransaction.validation.js";

const router = express.Router();

// Middleware to select correct validation schema
const validateTransaction = (req, res, next) => {
    const type = req.body.type || req.query.type;
    switch (type) {
        case 'receipt': return validation(receiptSchema)(req, res, next);
        case 'disbursement': return validation(disbursementSchema)(req, res, next);
        case 'transfer': return validation(transferSchema)(req, res, next);
        default: return next(new Error("Invalid transaction type for validation"));
    }
};

router.use(protectedRoutes, applyCompanyFilter);
router.use(requireResourcePermission("finance_operations"));

router.route("/")
    .post(
        uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]),
        validateTransaction,
        createFinancialTransaction
    )
    .get(
        getAllFinancialTransactions
    );

router.route("/:id")
    .get(
        getOneTransaction
    )
    .patch(
        uploadMultiFiles(ATTACHMENT_MIMETYPES, [{ name: 'attachments', maxCount: 5 }]),
        validateTransaction,
        updateFinancialTransaction
    )
    .delete(
        deleteFinancialTransaction
    );

export default router;
