
import Joi from "joi";


export const addUserVal = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    type: Joi.string().valid('user', 'employee').default('user'),
    email: Joi.when('type', {
        is: 'user',
        then: Joi.string().email().required().messages({
            'string.email': '"email" must be a valid email',
            'string.empty': '"email" is not allowed to be empty',
            'any.required': '"email" is required'
        }),
        otherwise: Joi.string().email().optional().allow('', null)
    }),
    password: Joi.when('type', {
        is: 'user',
        then: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required().messages({
            'string.empty': '"password" is not allowed to be empty',
            'any.required': '"password" is required'
        }),
        otherwise: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).optional().allow('', null)
    }),
    confirmPassword: Joi.when('type', {
        is: 'user',
        then: Joi.string().required().valid(Joi.ref('password')).messages({
            'any.only': '"confirmPassword" must match password reference',
            'string.empty': '"confirmPassword" is not allowed to be empty',
            'any.required': '"confirmPassword" is required'
        }),
        otherwise: Joi.string().optional().allow('', null)
    }),
    role: Joi.string().valid('accountant', 'admin', 'employee', 'superAdmin'),
    companyId: Joi.string().hex().length(24),
    roleId: Joi.string().hex().length(24),
    systemRole: Joi.string().valid('superAdmin'),
    phone: Joi.string(),
})

export const updateUserVal = Joi.object({
    id: Joi.string().hex().length(24).required(),
    type: Joi.string().valid('user', 'employee'),
    name: Joi.string().min(3).max(30),
    email: Joi.string().email().allow('', null),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).allow('', null),
    confirmPassword: Joi.when('password', {
        is: Joi.exist(),
        then: Joi.string().required().valid(Joi.ref('password')).messages({
            'any.only': '"confirmPassword" must match password reference',
            'string.empty': '"confirmPassword" is not allowed to be empty',
            'any.required': '"confirmPassword" is required'
        }),
        otherwise: Joi.string().optional().allow('', null)
    }),
    role: Joi.string().valid('accountant', 'admin', 'employee', 'superAdmin'),
    companyId: Joi.string().hex().length(24),
    roleId: Joi.string().hex().length(24),
    systemRole: Joi.string().valid('superAdmin'),
    phone: Joi.string(),
})

export const deleteUserVal = Joi.object({
    id: Joi.string().hex().length(24).required()
})

export const getUserByIdVal = Joi.object({
    id: Joi.string().hex().length(24).required()
})
