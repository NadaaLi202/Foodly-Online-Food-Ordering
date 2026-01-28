import express from "express";
import { 
    addCustomer, 
    deleteCustomer, 
    getAllCustomers, 
    getCustomerById, 
    updateCustomer 
} from "./customer.controller.js";

import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { fileUpload } from "../../middleware/fileUploads.js";

export const customerRouter = express.Router();

// Add a new customer
customerRouter.post('/', addCustomer);

// Get all customers by user ID
customerRouter.get('/:userId', protectedRoutes, allowedTo("user"), getAllCustomers);

// Get a customer by ID
customerRouter.get('/get/:id',protectedRoutes, allowedTo("user"), getCustomerById); // error

// Update a customer
customerRouter.put('/:id', protectedRoutes, allowedTo("user"),fileUpload('logo','customer') ,updateCustomer);

// Delete a customer
customerRouter.delete('/:id', protectedRoutes, allowedTo("user"), deleteCustomer);
