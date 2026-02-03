import express from "express";
import {
    createTransaction,
    getAllTransactions,
    getOne,
    updateOne,
    deleteOne
} from "./transaction.controller.js";

const router = express.Router();

// ================= SALES =================

// Sales Invoices
router.post("/sales/invoices", createTransaction("sales", "invoice"));
router.get("/sales/invoices", getAllTransactions("sales", "invoice"));

// Sales Returns
router.post("/sales/returns", createTransaction("sales", "return"));
router.get("/sales/returns", getAllTransactions("sales", "return"));

// Sales Quotations
router.post("/sales/quotations", createTransaction("sales", "quotation"));
router.get("/sales/quotations", getAllTransactions("sales", "quotation"));


// ================= PURCHASES =================

// Purchase Invoices
router.post("/purchases/invoices", createTransaction("purchases", "invoice"));
router.get("/purchases/invoices", getAllTransactions("purchases", "invoice"));

// Purchase Returns
router.post("/purchases/returns", createTransaction("purchases", "return"));
router.get("/purchases/returns", getAllTransactions("purchases", "return"));

// Purchase Orders
router.post("/purchases/purchaseOrder", createTransaction("purchases", "purchaseOrder"));
router.get("/purchases/purchaseOrder", getAllTransactions("purchases", "purchaseOrder"));


// ================= SHARED =================
router.route("/:id")
    .get(getOne)
    .patch(updateOne)
    .delete(deleteOne);

export default router;
