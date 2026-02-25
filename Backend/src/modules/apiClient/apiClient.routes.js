import express from "express";
import * as apiClientController from "./apiClient.controller.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";

const apiClientRouter = express.Router();

apiClientRouter.use(protectedRoutes);
apiClientRouter.use(allowedTo('admin'));

apiClientRouter.get('/', apiClientController.getAllClients);
apiClientRouter.post('/', apiClientController.createClient);
apiClientRouter.delete('/:id', apiClientController.deleteClient);
apiClientRouter.patch('/:id/token', apiClientController.regenerateToken);

export default apiClientRouter;
