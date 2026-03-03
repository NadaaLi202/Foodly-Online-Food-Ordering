import Joi from "joi";

const formatSchema = Joi.object({
    fontSize: Joi.number().min(1).max(72),
    color: Joi.string(),
    align: Joi.string().valid('left', 'center', 'right'),
    bold: Joi.boolean()
});

const rowSchema = Joi.object({
    text: Joi.string().allow('').default(''),
    format: formatSchema.default({})
});

const rowsArray = Joi.array().items(rowSchema);

const pageConfigSchema = Joi.object({
    direction: Joi.string().valid('rtl', 'ltr'),
    pageSize: Joi.string(),
    fontSize: Joi.number().min(6).max(36),
    margins: Joi.object({
        top: Joi.number().min(0).max(100),
        right: Joi.number().min(0).max(100),
        bottom: Joi.number().min(0).max(100),
        left: Joi.number().min(0).max(100)
    })
});

const tableColumnSchema = Joi.object({
    key: Joi.string(),
    label: Joi.string().allow(''),
    enabled: Joi.boolean(),
    labelFormat: formatSchema,
    valueFormat: formatSchema
});

export const createTemplateSchema = Joi.object({
    name: Joi.string().trim().min(1).max(200).required(),
    type: Joi.string().valid('general', 'invoice', 'product-label').required(),
    branches: Joi.array().items(Joi.string()),
    page: pageConfigSchema,
    logo: Joi.object({
        url: Joi.string().allow(''),
        size: Joi.number().min(10).max(500)
    }),
    header: Joi.object({
        rows: rowsArray,
        order: Joi.string().allow(''),
        showBottomBorder: Joi.boolean(),
        invoiceInfoRows: rowsArray
    }),
    content: Joi.object({
        language: Joi.string().valid('ar', 'en')
    }),
    footer: Joi.object({
        signaturePosition: Joi.string().valid('after_notes', 'bottom'),
        signatures: Joi.array().items(Joi.object({
            label: Joi.string().allow(''),
            rows: rowsArray,
            imageUrl: Joi.string().allow(''),
            imageSize: Joi.number().min(10).max(500)
        })),
        beforeRows: rowsArray,
        afterRows: rowsArray,
        notesRows: rowsArray
    }),
    partner: Joi.object({
        clientRows: rowsArray,
        supplierRows: rowsArray
    }),
    table: Joi.object({
        deductTaxFromAmounts: Joi.boolean(),
        showTableLines: Joi.boolean(),
        cellMargins: Joi.object({
            top: Joi.number().min(0),
            right: Joi.number().min(0),
            bottom: Joi.number().min(0),
            left: Joi.number().min(0)
        }),
        columns: Joi.array().items(tableColumnSchema),
        footerRows: Joi.array().items(Joi.object({
            key: Joi.string(),
            label: Joi.string().allow(''),
            enabled: Joi.boolean()
        }))
    }),
    label: Joi.object({
        width: Joi.number().min(5).max(500),
        height: Joi.number().min(5).max(500),
        contentRows: rowsArray
    })
}).unknown(true);

export const updateTemplateSchema = createTemplateSchema;
