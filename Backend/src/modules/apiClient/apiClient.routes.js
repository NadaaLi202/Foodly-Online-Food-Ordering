import express from "express";
import * as apiClientController from "./apiclient.controller.js";
import { protectedRoutes, allowedTo } from "../auth/auth.controller.js";
import { applyCompanyFilter } from "../../middleware/applycompanyfilter.js";

const apiClientRouter = express.Router();

apiClientRouter.use(protectedRoutes);
apiClientRouter.use(allowedTo('admin', 'superAdmin'));
apiClientRouter.use(applyCompanyFilter);

apiClientRouter.get('/', apiClientController.getAllClients);
apiClientRouter.post('/', apiClientController.createClient);
apiClientRouter.delete('/:id', apiClientController.deleteClient);
apiClientRouter.patch('/:id/token', apiClientController.regenerateToken);

export default apiClientRouter;
