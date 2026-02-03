import Joi from "joi";

// Add Inventory Exchange
export const addInventoryExchangeSchema = Joi.object({
    operation: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "Operation ID غير صحيح",
            "string.length": "Operation ID غير صحيح",
            "any.required": "Operation مطلوب"
        }),

    warehouse: Joi.string()
        .valid("main")
        .required()
        .messages({
            "any.only": "المخزن يجب أن يكون المستودع الرئيسي فقط",
            "any.required": "المخزن مطلوب"
        }),

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
            "number.base": "الكمية يجب أن تكون رقم",
            "number.greater": "الكمية يجب أن تكون أكبر من صفر",
            "any.required": "الكمية مطلوبة"
        }),

    account: Joi.string().allow(""),
    description: Joi.string().allow(""),
    attachments: Joi.array().items(Joi.string()),
    createdBy: Joi.string().hex().length(24)
});

// Update Inventory Exchange
export const updateInventoryExchangeSchema = Joi.object({
    operation: Joi.string().hex().length(24),

    warehouse: Joi.string()
        .valid("main")
        .messages({
            "any.only": "المخزن يجب أن يكون المستودع الرئيسي فقط"
        }),

    product: Joi.string().hex().length(24),
    quantity: Joi.number().greater(0),

    account: Joi.string().allow(""),
    description: Joi.string().allow(""),
    attachments: Joi.array().items(Joi.string()),

    id: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "ID غير صحيح",
            "string.length": "ID غير صحيح",
            "any.required": "ID مطلوب"
        })
});
