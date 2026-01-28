
import Joi from "joi";


export const addUserVal = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    role: Joi.string().allow('accountant', 'admin', 'employee', 'user'),
    phone: Joi.string(),
})

export const updateUserVal = Joi.object({
    id: Joi.string().hex().length(24).required(),
    name: Joi.string().min(3).max(30),
    email: Joi.string().email(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    role: Joi.string().allow('accountant', 'admin', 'employee', 'user'),
    phone: Joi.string(),
})

export const deleteUserVal = Joi.object({
    id: Joi.string().hex().length(24).required()
})

export const getUserByIdVal = Joi.object({
    id: Joi.string().hex().length(24).required()
})
