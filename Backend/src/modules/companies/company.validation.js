import Joi from "joi";

const addCompanySchema = Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    email: Joi.string().email().required().trim(),
    password: Joi.string().min(6).max(30).required(),
    phone: Joi.string().allow('', null).trim().optional(),
    subscriptionStatus: Joi.string().valid('active', 'expired').default('active'),
    subscriptionEndDate: Joi.date().iso()
});

const updateCompanySchema = Joi.object({
    name: Joi.string().min(2).max(100).trim(),
    email: Joi.string().email().trim(),
    password: Joi.string().min(6).max(30),
    phone: Joi.string().allow('', null).trim().optional(),
    subscriptionStatus: Joi.string().valid('active', 'expired'),
    subscriptionEndDate: Joi.date().iso(),
    id: Joi.string().hex().length(24).required()
});

export { addCompanySchema, updateCompanySchema };
