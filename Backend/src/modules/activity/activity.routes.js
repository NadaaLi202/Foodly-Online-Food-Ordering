import express from "express";
import { addActivity, deleteActivity, getActivityById, getAllActivities, updateActivity } from "./activity.controller.js";
import { validation } from "../../middleware/validation.js";
import { addActivitySchema, updateActivitySchema } from "./activity.validation.js";

const activityRouter = express.Router();

activityRouter.post('/', validation(addActivitySchema), addActivity);
activityRouter.get('/', getAllActivities);
activityRouter.get('/:id', getActivityById);
activityRouter.put('/:id', validation(updateActivitySchema), updateActivity);
activityRouter.delete('/:id', deleteActivity);

export default activityRouter;
