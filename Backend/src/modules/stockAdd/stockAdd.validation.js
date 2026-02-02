// validations/stockAdd.validation.js
import Joi from "joi";

// StockAdd
export const addStockAddSchema = Joi.object({
    operation: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.hex": "Operation ID غير صحيح",
            "string.length": "Operation ID غير صحيح",
            "any.required": "Operation مطلوب"
        }),
    account: Joi.string().required().messages({
        "any.required": "الحساب مطلوب"
    }),
    warehouse: Joi.string()
        .valid("main", "secondary")
        .required()
        .messages({
            "any.only": "المخزن يجب أن يكون main أو secondary",
            "any.required": "المخزن مطلوب"
        }),
    description: Joi.string().allow(""),
    attachments: Joi.array().items(Joi.string()),
    createdBy: Joi.string().hex().length(24).messages({
        "string.hex": "ID المستخدم غير صحيح",
        "string.length": "ID المستخدم غير صحيح"
    })
});

export const updateStockAddSchema = Joi.object({
    operation: Joi.string().hex().length(24).messages({
        "string.hex": "Operation ID غير صحيح",
        "string.length": "Operation ID غير صحيح"
    }),
    account: Joi.string(),
    warehouse: Joi.string().valid("main", "secondary").messages({
        "any.only": "المخزن يجب أن يكون main أو secondary"
    }),
    description: Joi.string(),
    attachments: Joi.array().items(Joi.string()),
    createdBy: Joi.string().hex().length(24).messages({
        "string.hex": "ID المستخدم غير صحيح",
        "string.length": "ID المستخدم غير صحيح"
    }),
    id: Joi.string().hex().length(24).required().messages({
        "string.hex": "ID غير صحيح",
        "string.length": "ID غير صحيح",
        "any.required": "ID مطلوب"
    })
});

// StockAddItem
export const addStockAddItemSchema = Joi.object({
    stockAdd: Joi.string().hex().length(24).required().messages({
        "string.hex": "StockAdd ID غير صحيح",
        "string.length": "StockAdd ID غير صحيح",
        "any.required": "StockAdd مطلوب"
    }),
    product: Joi.string().hex().length(24).required().messages({
        "string.hex": "Product ID غير صحيح",
        "string.length": "Product ID غير صحيح",
        "any.required": "Product مطلوب"
    }),
    quantity: Joi.number().greater(0).required().messages({
        "number.base": "الكمية يجب أن تكون رقم",
        "number.greater": "الكمية يجب أن تكون أكبر من صفر",
        "any.required": "الكمية مطلوبة"
    }),
    unitCost: Joi.number().min(0).required().messages({
        "number.base": "تكلفة الوحدة يجب أن تكون رقم",
        "number.min": "تكلفة الوحدة لا يمكن أن تكون سالبة",
        "any.required": "تكلفة الوحدة مطلوبة"
    })
});

export const updateStockAddItemSchema = Joi.object({
    stockAdd: Joi.string().hex().length(24).messages({
        "string.hex": "StockAdd ID غير صحيح",
        "string.length": "StockAdd ID غير صحيح"
    }),
    product: Joi.string().hex().length(24).messages({
        "string.hex": "Product ID غير صحيح",
        "string.length": "Product ID غير صحيح"
    }),
    quantity: Joi.number().greater(0).messages({
        "number.base": "الكمية يجب أن تكون رقم",
        "number.greater": "الكمية يجب أن تكون أكبر من صفر"
    }),
    unitCost: Joi.number().min(0).messages({
        "number.base": "تكلفة الوحدة يجب أن تكون رقم",
        "number.min": "تكلفة الوحدة لا يمكن أن تكون سالبة"
    }),
    id: Joi.string().hex().length(24).required().messages({
        "string.hex": "ID غير صحيح",
        "string.length": "ID غير صحيح",
        "any.required": "ID مطلوب"
    })
});
