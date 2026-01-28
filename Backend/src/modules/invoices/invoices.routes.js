import express from "express";
import { createInvoice, deleteInvoice, getAllInvoices, getInvoiceById, updateInvoice } from "./invoices.controller.js";
import { validation } from "../../middleware/validation.js";
import { createInvoiceSchema, updateInvoiceSchema } from "./invoices.validation.js";

const invoiceRouter = express.Router();

invoiceRouter.route('/')
    .post(validation(createInvoiceSchema), createInvoice)
    .get(getAllInvoices);

invoiceRouter.route('/:id')
    .get(getInvoiceById)
    .put(validation(updateInvoiceSchema), updateInvoice)
    .delete(deleteInvoice);

export default invoiceRouter;