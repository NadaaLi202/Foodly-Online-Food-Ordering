import express from "express";
import {
    addRequisition,
    getAllRequisitions,
    getRequisitionById,
    updateRequisition,
    deleteRequisition
} from "./requisition.controller.js";
import { validation } from "../../middleware/validation.js";
import { addRequisitionSchema, updateRequisitionSchema } from "./requisition.validation.js";

const router = express.Router();

router.route("/")
    .post(validation(addRequisitionSchema), addRequisition)
    .get(getAllRequisitions);

router.route("/:id")
    .get(getRequisitionById)
    .patch(validation(updateRequisitionSchema), updateRequisition)
    .delete(deleteRequisition);

export default router;
