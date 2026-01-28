import Joi from "joi";

const addPaymentSchema = Joi.object({
    invoice: Joi.string().hex().length(24).required(),
    amount: Joi.number().required(),
    method: Joi.string().valid('Credit Card', 'PayPal', 'Bank Transfer', 'Cash').required(),
    status: Joi.string().valid('Completed', 'Pending', 'Failed'),
    date: Joi.date()
});

const updatePaymentSchema = Joi.object({
    invoice: Joi.string().hex().length(24),
    amount: Joi.number(),
    method: Joi.string().valid('Credit Card', 'PayPal', 'Bank Transfer', 'Cash'),
    status: Joi.string().valid('Completed', 'Pending', 'Failed'),
    date: Joi.date(),
    id: Joi.string().hex().length(24).required()
});

export { addPaymentSchema, updatePaymentSchema };
