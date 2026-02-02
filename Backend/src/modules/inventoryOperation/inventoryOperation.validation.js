import Joi from "joi";

// Add Inventory Operation
export const addInventoryOperationSchema = Joi.object({
  warehouse: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({ "any.required": "المخزن مطلوب" }),

  mainBranch: Joi.string().valid("main").optional(),

  date: Joi.date().optional(),

  description: Joi.string().trim().optional()
});

// Update Inventory Operation
export const updateInventoryOperationSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({ "any.required": "ID مطلوب" }),

  warehouse: Joi.string().hex().length(24).optional(),

  mainBranch: Joi.string().valid("main").optional(),

  date: Joi.date().optional(),

  description: Joi.string().trim().optional()
});
