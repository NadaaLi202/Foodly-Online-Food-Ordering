import Joi from "joi";

export const addRequisitionSchema = Joi.object({
    number: Joi.string().required().messages({
        "any.required": "الرقم مطلوب"
    }),
    warehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).required().messages({
        "any.required": "المخزن مطلوب"
    }),
    startDate: Joi.date().required().messages({
        "any.required": "تاريخ البدء مطلوب",
        "date.base": "تاريخ البدء غير صحيح"
    }),
    endDate: Joi.date().required().messages({
        "any.required": "تاريخ الانتهاء مطلوب",
        "date.base": "تاريخ الانتهاء غير صحيح"
    }),
    status: Joi.string().valid("pending", "approved", "rejected").optional(),
    createdBy: Joi.string().hex().length(24).optional()
});

export const updateRequisitionSchema = Joi.object({
    id: Joi.string().hex().length(24).required(),
    number: Joi.string().optional(),
    warehouse: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.string().valid("main", "secondary")
    ).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid("pending", "approved", "rejected").optional(),
    createdBy: Joi.string().hex().length(24).optional()
});
