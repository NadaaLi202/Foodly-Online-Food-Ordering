import Joi from "joi";

const updateSettingsSchema = Joi.object({
    category: Joi.string().valid('general', 'sales', 'purchases', 'customers', 'suppliers', 'accounting', 'export', 'coding').required(),
    settings: Joi.object().when('category', {
        is: 'general',
        then: Joi.object({
            company_name: Joi.string().required().messages({
                "string.empty": "Company name is required",
                "any.required": "Company name is required"
            })
        }).unknown(true),
        otherwise: Joi.object().unknown(true)
    }).required()
});

const getSettingsSchema = Joi.object({
    category: Joi.string().valid('general', 'sales', 'purchases', 'customers', 'suppliers', 'accounting', 'export', 'coding').optional()
});

const codingSettingsSchema = Joi.object({
    entity: Joi.string().trim().optional(),
    prefix: Joi.string().trim().required().messages({
        "string.empty": "Prefix is required",
        "any.required": "Prefix is required"
    }),
    year: Joi.string().trim().required(),
    branchScope: Joi.string().valid('branch', 'global').required(),
    minDigits: Joi.number().integer().min(1).required().messages({
        "number.min": "Min digits must be at least 1"
    }),
    separator: Joi.string().allow('').required()
});

const codingSequenceSchema = Joi.object({
    entity: Joi.string().trim().optional(),
    branchId: Joi.string().trim().required(),
    sequence: Joi.number().integer().min(0).required().messages({
        "number.min": "Sequence must be greater than or equal to 0"
    })
});

const getCodingSettingsSchema = Joi.object({
    entity: Joi.string().trim().optional()
});

export { updateSettingsSchema, getSettingsSchema, codingSettingsSchema, codingSequenceSchema, getCodingSettingsSchema };
