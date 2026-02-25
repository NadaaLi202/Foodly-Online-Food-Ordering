import Joi from "joi";

const updateZatcaSchema = Joi.object({
    isEnabled: Joi.boolean(),
    phase: Joi.string().valid('phase1', 'phase2'),
    settings: Joi.object({
        phase1: Joi.object({
            isActive: Joi.boolean()
        }),
        phase2: Joi.object({
            isActive: Joi.boolean(),
            environment: Joi.string().valid('sandbox', 'simulation', 'production'),
            taxNumber: Joi.string().length(15).pattern(/^\d+$/).when(Joi.ref('phase', { ancestor: 2 }), {
                is: 'phase2',
                then: Joi.required(),
                otherwise: Joi.allow('', null)
            }).messages({
                "string.length": "يجب أن يتكون الرقم الضريبي من 15 رقم",
                "string.pattern.base": "يجب أن يحتوي الرقم الضريبي على أرقام فقط",
                "string.empty": "الرقم الضريبي مطلوب",
                "any.required": "الرقم الضريبي مطلوب"
            }),
            otp: Joi.string().when(Joi.ref('phase', { ancestor: 2 }), {
                is: 'phase2',
                then: Joi.required(),
                otherwise: Joi.allow('', null)
            }).messages({
                "string.empty": "رمز التحقق (OTP) الأول مطلوب",
                "any.required": "رمز التحقق (OTP) الأول مطلوب"
            }),
            otp2: Joi.string().when(Joi.ref('phase', { ancestor: 2 }), {
                is: 'phase2',
                then: Joi.required(),
                otherwise: Joi.allow('', null)
            }).messages({
                "string.empty": "رمز التحقق (OTP) الثاني مطلوب",
                "any.required": "رمز التحقق (OTP) الثاني مطلوب"
            }),
            commonName: Joi.string().allow('', null),
            organizationName: Joi.string().when(Joi.ref('phase', { ancestor: 2 }), {
                is: 'phase2',
                then: Joi.required(),
                otherwise: Joi.allow('', null)
            }).messages({
                "string.empty": "اسم المنشأة مطلوب",
                "any.required": "اسم المنشأة مطلوب"
            }),
            organizationUnitName: Joi.string().when(Joi.ref('phase', { ancestor: 2 }), {
                is: 'phase2',
                then: Joi.required(),
                otherwise: Joi.allow('', null)
            }).messages({
                "string.empty": "اسم الفرع مطلوب",
                "any.required": "اسم الفرع مطلوب"
            }),
            serialNumber: Joi.string().allow('', null),
            registeredAddress: Joi.string().when(Joi.ref('phase', { ancestor: 2 }), {
                is: 'phase2',
                then: Joi.required(),
                otherwise: Joi.allow('', null)
            }).messages({
                "string.empty": "العنوان المسجل مطلوب",
                "any.required": "العنوان المسجل مطلوب"
            }),
            businessCategory: Joi.string().when(Joi.ref('phase', { ancestor: 2 }), {
                is: 'phase2',
                then: Joi.required(),
                otherwise: Joi.allow('', null)
            }).messages({
                "string.empty": "تصنيف النشاط مطلوب",
                "any.required": "تصنيف النشاط مطلوب"
            }),
            certificate: Joi.string().allow('', null),
            privateKey: Joi.string().allow('', null),
            secret: Joi.string().allow('', null)
        })
    })
});

const getZatcaSchema = Joi.object({});

export { updateZatcaSchema, getZatcaSchema };
