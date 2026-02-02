import Joi from "joi";

// Add Operation
export const addOperationSchema = Joi.object({
    type: Joi.string()
        .valid(
            "stock add process",
            "inventory exchange process",
            "transfer process"
        )
        .required()
        .messages({
            "any.only": "نوع العملية غير صحيح",
            "any.required": "نوع العملية مطلوب"
        })
});

// Update Operation
export const updateOperationSchema = Joi.object({
    type: Joi.string()
        .valid(
            "stock add process",
            "inventory exchange process",
            "transfer process"
        )
        .messages({
            "any.only": "نوع العملية غير صحيح"
        }),

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
