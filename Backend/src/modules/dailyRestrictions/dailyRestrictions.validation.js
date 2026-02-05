import Joi from "joi";

export const addRestrictionSchema = Joi.object({
    number: Joi.string().required().trim(),
    date: Joi.date().required(),
    description: Joi.string().allow('').optional(),
    totalDebit: Joi.number().required(),
    totalCredit: Joi.number().required(),
    entries: Joi.array().items(Joi.object({
        account: Joi.string().required(),
        description: Joi.string().allow('').optional(),
        debit: Joi.number().min(0).optional(),
        credit: Joi.number().min(0).optional()
    })).required().min(1)
});

export const updateRestrictionSchema = Joi.object({
    number: Joi.string().optional().trim(),
    date: Joi.date().optional(),
    description: Joi.string().allow('').optional(),
    totalDebit: Joi.number().optional(),
    totalCredit: Joi.number().optional(),
    entries: Joi.array().items(Joi.object({
        account: Joi.string().required(),
        description: Joi.string().allow('').optional(),
        debit: Joi.number().min(0).optional(),
        credit: Joi.number().min(0).optional(),
        _id: Joi.string().optional() // Allow _id for updates
    })).optional()
});
