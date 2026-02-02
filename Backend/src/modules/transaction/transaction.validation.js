export const transactionSchema = Joi.object({
    transactionNumber: Joi.string().required(),
    contact: Joi.string().hex().length(24).required(),
    issueDate: Joi.date().required(),
    dueDate: Joi.date().optional(),

    items: Joi.array().items(
        Joi.object({
            product: Joi.string().hex().length(24).required(),
            quantity: Joi.number().positive().required(),
            unitPrice: Joi.number().min(0).required(),
            discountPercent: Joi.number().min(0).max(100).optional(),
            taxPercent: Joi.number().min(0).optional()
        })
    ).min(1).required(),

    notes: Joi.string().optional(),

    // خلي دول optional
    paidAmount: Joi.number().min(0).optional(),
    paymentMethod: Joi.string().optional()
});
