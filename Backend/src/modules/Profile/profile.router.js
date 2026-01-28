
import express from "express";
import { 
    addProfile, 
    getAllProfiles, 
    getProfileById, 
    updateProfile, 
    deleteProfile 
} from "./profile.controller.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { fileUpload } from "../../middleware/fileUploads.js";


const profileRouter = express.Router();

// Define routes
profileRouter.post('/', protectedRoutes,allowedTo("user","customer"),fileUpload('image','profile'), addProfile); 
profileRouter.get('/', protectedRoutes,allowedTo("user"), getAllProfiles); 
profileRouter.get('/:id', protectedRoutes,allowedTo("user","customer") ,getProfileById); 
profileRouter.put('/:id',protectedRoutes,allowedTo("customer") ,updateProfile);  
profileRouter.delete('/:id', protectedRoutes,allowedTo("user","customer"), deleteProfile); 

// Export the router
export default profileRouter;