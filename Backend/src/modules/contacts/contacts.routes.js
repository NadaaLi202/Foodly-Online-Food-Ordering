import express from "express";
import {
    addContact,
    getAllContacts,
    getContactById,
    updateContact,
    deleteContact
} from "./contacts.controller.js";
import Contact from "./contacts.model.js";
import { validation } from "../../middleware/validation.js";
import { contactSchema } from "./contacts.validation.js";
import { protectedRoutes, requirePermission, requireResolvedPermission } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";
import { AppError } from "../../utils/apperror.js";

const router = express.Router();

router.use(protectedRoutes, applyCompanyFilter);

const contactPermissionFromRecord = (action) =>
    requireResolvedPermission(async (req) => {
        const contact = await Contact.findOne({ _id: req.params.id, ...req.companyFilter })
            .select("module")
            .lean();
        if (!contact) {
            throw new AppError("Contact not found", 404);
        }
        const key = contact.module === "customer" ? "customers" : "suppliers";
        return `${key}:${action}`;
    });

// CUSTOMERS
router.post("/customers", validation(contactSchema), requirePermission("customers:add"), addContact("customer"));
router.get("/customers", requirePermission("customers:view"), getAllContacts("customer"));

// SUPPLIERS
router.post("/suppliers", validation(contactSchema), requirePermission("suppliers:add"), addContact("supplier"));
router.get("/suppliers", requirePermission("suppliers:view"), getAllContacts("supplier"));

// SHARED
router.get("/:id", contactPermissionFromRecord("view"), getContactById);
router.patch("/:id", validation(contactSchema), contactPermissionFromRecord("edit"), updateContact);
router.delete("/:id", contactPermissionFromRecord("delete"), deleteContact);

export default router;
