import Joi from "joi";

const createInvoiceSchema = Joi.object({
    invoiceNumber: Joi.string().required().trim(),
    customerId: Joi.string().hex().length(24).required(),
    items: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        price: Joi.number().required()
    })).required().min(1),
    totalAmount: Joi.number().required(),
    status: Joi.string().valid('paid', 'pending', 'cancelled'),
    issueDate: Joi.date(),
    dueDate: Joi.date()
});

const updateInvoiceSchema = Joi.object({
    invoiceNumber: Joi.string().trim(),
    customerId: Joi.string().hex().length(24),
    items: Joi.array().items(Joi.object({
        name: Joi.string(),
        quantity: Joi.number().min(1),
        price: Joi.number()
    })).min(1),
    totalAmount: Joi.number(),
    status: Joi.string().valid('paid', 'pending', 'cancelled'),
    issueDate: Joi.date(),
    dueDate: Joi.date(),
    id: Joi.string().hex().length(24).required()
});

export { createInvoiceSchema, updateInvoiceSchema };
