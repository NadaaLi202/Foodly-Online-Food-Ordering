import Joi from "joi";

export const addTransferProcessSchema = Joi.object({
    operation: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "Operation ID غير صحيح",
            "string.length": "Operation ID غير صحيح",
            "any.required": "Operation مطلوب"
        }),

    fromWarehouse: Joi.string()
        .valid("main")
        .required(),

    toWarehouse: Joi.string()
        .valid("main")
        .required(),

    product: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "Product ID غير صحيح",
            "string.length": "Product ID غير صحيح",
            "any.required": "المنتج مطلوب"
        }),

    quantity: Joi.number()
        .greater(0)
        .required()
        .messages({
            "number.greater": "الكمية يجب أن تكون أكبر من صفر",
            "any.required": "الكمية مطلوبة"
        }),

    description: Joi.string().allow("").optional(),

    attachments: Joi.array()
        .items(Joi.string())
        .optional()
});




export const updateTransferProcessSchema = Joi.object({
    id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "ID غير صحيح",
            "string.length": "ID غير صحيح",
            "any.required": "ID مطلوب"
        }),

    operation: Joi.string()
        .hex()
        .length(24)
        .optional(),

    fromWarehouse: Joi.string()
        .valid("main")
        .optional(),

    toWarehouse: Joi.string()
        .valid("main")
        .optional(),

    product: Joi.string()
        .hex()
        .length(24)
        .optional(),

    quantity: Joi.number()
        .greater(0)
        .optional(),

    description: Joi.string().allow("").optional(),

    attachments: Joi.array()
        .items(Joi.string())
        .optional()
});
