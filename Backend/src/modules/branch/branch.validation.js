import Joi from "joi";

export const addBranchSchema = Joi.object({
    name: Joi.string().required().trim(),
    code: Joi.string().required().trim(),
    address1: Joi.string().allow('').optional(),
    address2: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    neighborhood: Joi.string().allow('').optional(),
    postalCode: Joi.string().allow('').optional(),
    region: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
    phone: Joi.string().optional().allow(''),
    commercialRegister: Joi.string().allow('').optional(),
    partnerList: Joi.string().required(),
    activity: Joi.string().required(),
    status: Joi.string().valid('active', 'inactive').default('active')
});

export const updateBranchSchema = Joi.object({
    name: Joi.string().optional().trim(),
    code: Joi.string().optional().trim(),
    address1: Joi.string().allow('').optional(),
    address2: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    neighborhood: Joi.string().allow('').optional(),
    postalCode: Joi.string().allow('').optional(),
    region: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
    phone: Joi.string().optional().allow(''),
    commercialRegister: Joi.string().allow('').optional(),
    partnerList: Joi.string().optional(),
    activity: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive').optional()
});
