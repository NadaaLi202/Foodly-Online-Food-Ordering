
import express from "express";
import { signIn, signup } from "./auth.controller.js";


import { validation } from "../../middleware/validation.js";
import { signinVal, signupVal } from "./auth.validation.js";

const authRouter = express.Router();

authRouter.post('/signup', validation(signupVal), signup) // register
authRouter.post('/signIn', validation(signinVal), signIn) // login


export default authRouter;
