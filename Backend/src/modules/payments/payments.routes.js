import express from "express";
import { addPayment, deletePayment, getAllPayments, getPaymentById, updatePayment } from "./payments.controller.js";
import { validation } from "../../middleware/validation.js";
import { addPaymentSchema, updatePaymentSchema } from "./payments.validation.js";

const paymentRouter = express.Router();

paymentRouter.route('/')
    .post(validation(addPaymentSchema), addPayment)
    .get(getAllPayments);

paymentRouter.route('/:id')
    .get(getPaymentById)
    .put(validation(updatePaymentSchema), updatePayment)
    .delete(deletePayment);

export default paymentRouter;
