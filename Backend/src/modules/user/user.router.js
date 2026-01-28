import express from "express"
import { addUser, deleteUser, getAllUsers, getUserById, updateUser } from "./user.controller.js";
import { allowedTo, protectedRoutes } from "../auth/auth.controller.js";
import { fileUpload } from "../../middleware/fileUploads.js";



import { validation } from "../../middleware/validation.js";
import { addUserVal, deleteUserVal, getUserByIdVal, updateUserVal } from "./user.validation.js";

export const userRouter = express.Router();

userRouter.post('/',fileUpload('image','user'), validation(addUserVal), addUser)
userRouter.get('/', protectedRoutes, allowedTo("admin"), getAllUsers)
userRouter.get('/:id', validation(getUserByIdVal), getUserById)
// userRouter.put('/:id',fileUpload('image','user'),updateUser)
userRouter.put('/:id', fileUpload('image','user'), validation(updateUserVal), updateUser)

userRouter.delete('/:id', validation(deleteUserVal), protectedRoutes, allowedTo("admin", "user"), deleteUser)




