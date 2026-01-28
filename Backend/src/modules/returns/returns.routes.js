import express from "express";
import { addReturn, deleteReturn, getAllReturns, getReturnById, updateReturn } from "./returns.controller.js";
import { validation } from "../../middleware/validation.js";
import { addReturnSchema, updateReturnSchema } from "./returns.validation.js";

const returnsRouter = express.Router();

returnsRouter.route('/')
    .post(validation(addReturnSchema), addReturn)
    .get(getAllReturns);

returnsRouter.route('/:id')
    .get(getReturnById)
    .put(validation(updateReturnSchema), updateReturn)
    .delete(deleteReturn);

export default returnsRouter;
