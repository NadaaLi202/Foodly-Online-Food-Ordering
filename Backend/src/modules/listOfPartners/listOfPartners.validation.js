import Joi from "joi";

export const addPartnerListSchema = Joi.object({
    name: Joi.string().required().trim(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    description: Joi.string().allow('').optional()
});

export const updatePartnerListSchema = Joi.object({
    name: Joi.string().optional().trim(),
    status: Joi.string().valid('active', 'inactive').optional(),
    description: Joi.string().allow('').optional()
});
