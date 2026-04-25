import express from "express";
import {
    addPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
    downloadPaymentPDF
} from "./payments.controller.js";
import Payment from "./payments.model.js";
import { validation } from "../../middleware/validation.js";
import { paymentSchema } from "./payments.validation.js";
import { protectedRoutes, requirePermission, requireResolvedPermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applyCompanyFilter.js";
import { AppError } from "../../utils/AppError.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

const paymentPermissionFromRecord = (action) =>
    requireResolvedPermission(async (req) => {
        const payment = await Payment.findOne({ _id: req.params.id, ...req.companyFilter })
            .select("module")
            .lean();
        if (!payment) {
            throw new AppError("Payment not found", 404);
        }
        const key = payment.module === "sales" ? "customer_payments" : "supplier_payments";
        return `${key}:${action}`;
    });

// ================= SALES PAYMENTS =================

router.post("/sales", validation(paymentSchema), requirePermission("customer_payments:add"), addPayment("sales"));
router.get("/sales", requirePermission("customer_payments:view"), getAllPayments("sales"));


// ================= PURCHASES PAYMENTS =================

router.post("/purchases", validation(paymentSchema), requirePermission("supplier_payments:add"), addPayment("purchases"));
router.get("/purchases", requirePermission("supplier_payments:view"), getAllPayments("purchases"));


// ================= SHARED =================

router.get("/:id/download", paymentPermissionFromRecord("view"), downloadPaymentPDF);
router.get("/:id", paymentPermissionFromRecord("view"), getPaymentById);
router.patch("/:id", validation(paymentSchema), paymentPermissionFromRecord("edit"), updatePayment);
router.delete("/:id", paymentPermissionFromRecord("delete"), deletePayment);

export default router;
