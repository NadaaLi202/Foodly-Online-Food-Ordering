import express from "express";
import {
    addPayment,
    getAllPayments,
    getPaymentById,
    updatePayment,
    deletePayment
} from "./payments.controller.js";
import { validation } from "../../middleware/validation.js";
import { paymentSchema } from "./payments.validation.js";

const router = express.Router();

// ================= SALES PAYMENTS =================

router.post("/sales", validation(paymentSchema), addPayment("sales"));
router.get("/sales", getAllPayments("sales"));


// ================= PURCHASES PAYMENTS =================

router.post("/purchases", validation(paymentSchema), addPayment("purchases"));
router.get("/purchases", getAllPayments("purchases"));


// ================= SHARED =================

router.get("/:id", getPaymentById);
router.patch("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;