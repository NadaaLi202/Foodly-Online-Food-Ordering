import express from "express";
import {
    addContact,
    getAllContacts,
    getContactById,
    updateContact,
    deleteContact
} from "./contacts.controller.js";
import { validation } from "../../middleware/validation.js";
import { contactSchema } from "./contacts.validation.js";

const router = express.Router();

// CUSTOMERS
router.post("/customers", validation(contactSchema), addContact("customer"));
router.get("/customers", getAllContacts("customer"));

// SUPPLIERS
router.post("/suppliers", validation(contactSchema), addContact("supplier"));
router.get("/suppliers", getAllContacts("supplier"));

// SHARED
router.get("/:id", getContactById);
router.patch("/:id", validation(contactSchema), updateContact);
router.delete("/:id", deleteContact);

export default router;