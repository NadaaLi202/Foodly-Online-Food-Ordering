import Joi from "joi";

const createSaleSchema = Joi.object({
    saleNumber: Joi.string().required().trim(),
    customerId: Joi.string().hex().length(24).required(),
    items: Joi.array().items(Joi.object({
        productId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().min(1).required(),
        price: Joi.number().required()
    })).required().min(1),
    totalAmount: Joi.number().required(),
    status: Joi.string().valid('draft', 'completed', 'cancelled', 'returned'),
    invoiceId: Joi.string().hex().length(24),
    quoteId: Joi.string().hex().length(24),
    payments: Joi.array().items(Joi.string().hex().length(24)),
    returnId: Joi.string().hex().length(24),
    saleDate: Joi.date()
});

const updateSaleSchema = Joi.object({
    saleNumber: Joi.string().trim(),
    customerId: Joi.string().hex().length(24),
    items: Joi.array().items(Joi.object({
        productId: Joi.string().hex().length(24),
        quantity: Joi.number().min(1),
        price: Joi.number()
    })).min(1),
    totalAmount: Joi.number(),
    status: Joi.string().valid('draft', 'completed', 'cancelled', 'returned'),
    invoiceId: Joi.string().hex().length(24),
    quoteId: Joi.string().hex().length(24),
    payments: Joi.array().items(Joi.string().hex().length(24)),
    returnId: Joi.string().hex().length(24),
    saleDate: Joi.date(),
    id: Joi.string().hex().length(24).required()
});

export { createSaleSchema, updateSaleSchema };
