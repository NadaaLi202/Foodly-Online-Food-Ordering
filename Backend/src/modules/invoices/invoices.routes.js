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

const invoiceRouter = express.Router();

invoiceRouter.route('/')
    .post(validation(createInvoiceSchema), createInvoice)
    .get(getAllInvoices);

invoiceRouter.get('/search', searchInvoices);

invoiceRouter.get('/stats', getInvoiceStats);

// Routes للفاتورة المحددة
invoiceRouter.route('/:id')
    .get(getInvoiceById)
    .put(validation(updateInvoiceSchema), updateInvoice)
    .delete(deleteInvoice);

// Route لتحديث الحالة
invoiceRouter.patch('/:id/status', validation(updateStatusSchema), updateInvoiceStatus);

export default invoiceRouter;