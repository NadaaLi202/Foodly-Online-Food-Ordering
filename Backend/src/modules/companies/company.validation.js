import Joi from "joi";

const currencyValidator = Joi.string().valid("EGP", "USD", "EUR", "SAR", "AED", "GBP");

// Do NOT allow client to set companyId or slug (server-generated)
const addCompanySchema = Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().min(6).max(128).required(),
    phone: Joi.string().allow('', null).trim().optional(),
    subscriptionStatus: Joi.string().valid('active', 'expired').default('active'),
    subscriptionEndDate: Joi.date().iso().allow(null),
    defaultCurrency: currencyValidator.default('EGP').optional(),
    logo: Joi.any().strip(),
    companyId: Joi.string().hex().length(24).optional(),
    slug: Joi.forbidden()
});

const updateCompanySchema = Joi.object({
    name: Joi.string().min(2).max(100).trim(),
    email: Joi.string().email().trim().lowercase(),
    password: Joi.string().min(6).max(128).allow('', null).optional(),
    phone: Joi.string().allow('', null).trim().optional(),
    subscriptionStatus: Joi.string().valid('active', 'expired'),
    subscriptionEndDate: Joi.alternatives().try(
        Joi.date().iso(),
        Joi.string().allow('', null).empty(null)
    ).optional(),
    defaultCurrency: currencyValidator.optional(),
    logo: Joi.any().strip(),
    companyId: Joi.string().hex().length(24).optional(),
    slug: Joi.forbidden()
});

const companySignInSchema = Joi.object({
    email: Joi.string().email().required().trim().lowercase(),
    password: Joi.string().required()
});

const companySignupSchema = Joi.object({
    adminName: Joi.string().min(2).max(100).required().trim(),
    email: Joi.string().email().required().trim().lowercase(),
    phone: Joi.string().required().trim(),
    password: Joi.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).*$/).required()
        .messages({ 'string.pattern.base': 'Password must contain at least one letter and one number.' }),
    name: Joi.string().min(3).max(100).required().trim(),
    slug: Joi.string().regex(/^[a-z0-9]+$/).required().lowercase().trim()
        .messages({ 'string.pattern.base': 'Slug can only contain lowercase alphanumeric characters with no spaces.' }),
    commercialRegister: Joi.string().allow('', null).trim(),
    taxNumber: Joi.string().allow('', null).trim(),
    country: Joi.string().default('المملكة العربية السعودية'),
    address: Joi.string().required().trim(),
    city: Joi.string().required().trim(),
    priceType: Joi.string().valid('before_vat', 'after_vat').required(),
    zatcaEnabled: Joi.boolean().default(true)
});

export { addCompanySchema, updateCompanySchema, companySignInSchema, companySignupSchema };
