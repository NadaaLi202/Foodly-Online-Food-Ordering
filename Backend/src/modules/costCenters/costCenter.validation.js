import Joi from "joi";

const objectIdSchema = Joi.string().trim().length(24);
const optionalParentSchema = Joi.alternatives().try(objectIdSchema, Joi.valid(null), Joi.string().allow(''));

export const createCostCenterSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'string.empty': 'Name is required',
        'any.required': 'Name is required'
    }),
    type: Joi.string().valid('main', 'sub').required(),
    parentId: optionalParentSchema.optional(),
    parent_id: optionalParentSchema.optional(),
    isActive: Joi.boolean().optional(),
    branchId: Joi.alternatives().try(objectIdSchema, Joi.valid(null), Joi.string().allow('')).optional()
});

export const updateCostCenterSchema = Joi.object({
    id: objectIdSchema.required(),
    name: Joi.string().trim().optional(),
    type: Joi.string().valid('main', 'sub').optional(),
    parentId: optionalParentSchema.optional(),
    parent_id: optionalParentSchema.optional(),
    isActive: Joi.boolean().optional(),
    branchId: Joi.alternatives().try(objectIdSchema, Joi.valid(null), Joi.string().allow('')).optional()
});

export const idParamSchema = Joi.object({
    id: objectIdSchema.required()
});

export const listCostCentersSchema = Joi.object({
    branchId: Joi.alternatives().try(objectIdSchema, Joi.valid('all'), Joi.string().allow('')).optional(),
    activeOnly: Joi.boolean().optional()
});
