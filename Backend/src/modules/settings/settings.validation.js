import Joi from "joi";

const updateSettingsSchema = Joi.object({
    category: Joi.string().valid('general', 'sales', 'purchases', 'customers', 'suppliers', 'accounting', 'export').required(),
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
    category: Joi.string().valid('general', 'sales', 'purchases', 'customers', 'suppliers', 'accounting', 'export').optional()
});

export { updateSettingsSchema, getSettingsSchema };
