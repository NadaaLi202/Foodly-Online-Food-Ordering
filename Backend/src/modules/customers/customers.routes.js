import express from "express";
import { addCustomer, deleteCustomer, getAllCustomers, getCustomerById, updateCustomer } from "./customers.controller.js";
import { validation } from "../../middleware/validation.js";
import { addCustomerSchema, updateCustomerSchema } from "./customers.validation.js";

const customerRouter = express.Router();

customerRouter.route('/')
    .post(validation(addCustomerSchema), addCustomer)
    .get(getAllCustomers);

customerRouter.route('/:id')
    .get(getCustomerById)
    .put(validation(updateCustomerSchema), updateCustomer)
    .delete(deleteCustomer);

export default customerRouter;
