import express from "express";
import {
    createInvoice,
    deleteInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    searchInvoices,
    updateInvoiceStatus,
    getInvoiceStats
} from "./invoices.controller.js";
import { validation } from "../../middleware/validation.js";
import {
    createInvoiceSchema,
    updateInvoiceSchema,
    updateStatusSchema
} from "./invoices.validation.js";
import { protectedRoutes, requirePermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";

const invoiceRouter = express.Router();

invoiceRouter.use(protectedRoutes, applyCompanyFilter);

invoiceRouter.route('/')
    .post(validation(createInvoiceSchema), requirePermission("sales_invoices:add"), createInvoice)
    .get(requirePermission("sales_invoices:view"), getAllInvoices);

invoiceRouter.get('/search', requirePermission("sales_invoices:view"), searchInvoices);

invoiceRouter.get('/stats', requirePermission("sales_invoices:view"), getInvoiceStats);

// Routes للفاتورة المحددة
invoiceRouter.route('/:id')
    .get(requirePermission("sales_invoices:view"), getInvoiceById)
    .put(validation(updateInvoiceSchema), requirePermission("sales_invoices:edit"), updateInvoice)
    .delete(requirePermission("sales_invoices:delete"), deleteInvoice);

// Route لتحديث الحالة
invoiceRouter.patch('/:id/status', validation(updateStatusSchema), requirePermission("sales_invoices:edit"), updateInvoiceStatus);

export default invoiceRouter;
