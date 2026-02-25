import express from "express";
import * as codingController from "./coding.controller.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";

const codingRouter = express.Router();

codingRouter.use(protectedRoutes);
codingRouter.use(allowedTo('admin', 'accountant'));

codingRouter.get('/:entity', codingController.getCodingRules);
codingRouter.put('/:entity', codingController.updateCodingRules);
codingRouter.patch('/:entity/sequence', codingController.updateBranchSequence);

export default codingRouter;
