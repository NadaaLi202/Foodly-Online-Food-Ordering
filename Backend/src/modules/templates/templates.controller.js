import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import Template from "./templates.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

// ── Get all templates by type ──────────────────────────────────────
const getAllTemplates = catchAsyncError(async (req, res, next) => {
    const { type } = req.query;
    const query = { ...req.companyFilter };
    if (type) query.type = type;

    const templates = await Template.find(query).sort({ createdAt: -1 });
    res.status(200).json({ message: 'تم جلب القوالب بنجاح', templates });
});

// ── Get single template ────────────────────────────────────────────
const getTemplateById = catchAsyncError(async (req, res, next) => {
    const template = await Template.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!template) return next(new AppError('القالب غير موجود', 404));
    res.status(200).json({ message: 'تم جلب القالب بنجاح', template });
});

// ── Create template ────────────────────────────────────────────────
const createTemplate = catchAsyncError(async (req, res, next) => {
    const template = new Template({
        ...req.body,
        companyId: req.companyFilter.companyId || req.user.companyId || req.user._id
    });
    await template.save();
    res.status(201).json({ message: 'تم إنشاء القالب بنجاح', template });
});

// ── Update template ────────────────────────────────────────────────
const updateTemplate = catchAsyncError(async (req, res, next) => {
    const template = await Template.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!template) return next(new AppError('القالب غير موجود', 404));

    const updates = req.body;
    // Merge nested objects properly
    Object.keys(updates).forEach(key => {
        const val = updates[key];
        if (
            val !== null &&
            typeof val === 'object' &&
            !Array.isArray(val) &&
            key !== '_id' &&
            key !== 'companyId'
        ) {
            const existing = template[key]?.toObject ? template[key].toObject() : (template[key] ?? {});
            template[key] = { ...existing, ...val };
            template.markModified(key);
        } else {
            if (key !== '_id' && key !== 'companyId') {
                template[key] = val;
            }
        }
    });

    await template.save();
    res.status(200).json({ message: 'تم تحديث القالب بنجاح', template });
});

// ── Delete template ────────────────────────────────────────────────
const deleteTemplate = catchAsyncError(async (req, res, next) => {
    const template = await Template.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });
    if (!template) return next(new AppError('القالب غير موجود', 404));

    // Clean up cloudinary images
    if (template.logo?.publicId) await deleteFromCloudinary(template.logo.publicId);
    if (template.footer?.signatures) {
        for (const sig of template.footer.signatures) {
            if (sig.publicId) await deleteFromCloudinary(sig.publicId);
        }
    }

    res.status(200).json({ message: 'تم حذف القالب بنجاح', template });
});

// ── Upload logo ────────────────────────────────────────────────────
const uploadLogo = catchAsyncError(async (req, res, next) => {
    const template = await Template.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!template) return next(new AppError('القالب غير موجود', 404));
    if (!req.file) return next(new AppError('يرجى رفع ملف', 400));

    // Delete old logo from Cloudinary if exists
    if (template.logo?.publicId) {
        await deleteFromCloudinary(template.logo.publicId);
    }

    // Upload new logo to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'template_logos');

    template.logo = {
        url: result.secure_url,
        publicId: result.public_id,
        size: template.logo?.size ?? 70
    };
    await template.save();

    res.status(200).json({
        message: 'تم رفع الشعار بنجاح',
        logoUrl: result.secure_url,
        template
    });
});

// ── Upload signature image ─────────────────────────────────────────
const uploadSignature = catchAsyncError(async (req, res, next) => {
    const template = await Template.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!template) return next(new AppError('القالب غير موجود', 404));
    if (!req.file) return next(new AppError('يرجى رفع ملف', 400));

    const sigIndex = parseInt(req.params.index);
    if (isNaN(sigIndex) || sigIndex < 0 || sigIndex > 2) {
        return next(new AppError('رقم التوقيع غير صحيح (0-2)', 400));
    }

    // Delete old signature image from Cloudinary
    const oldSig = template.footer?.signatures?.[sigIndex];
    if (oldSig?.publicId) await deleteFromCloudinary(oldSig.publicId);

    // Upload new signature to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'template_signatures');

    if (!template.footer) template.footer = {};
    if (!template.footer.signatures) {
        template.footer.signatures = [
            { label: 'left', rows: [], imageUrl: '', imageSize: 100 },
            { label: 'middle', rows: [], imageUrl: '', imageSize: 100 },
            { label: 'right', rows: [], imageUrl: '', imageSize: 100 }
        ];
    }

    template.footer.signatures[sigIndex].imageUrl = result.secure_url;
    template.footer.signatures[sigIndex].publicId = result.public_id;
    template.markModified('footer');
    await template.save();

    res.status(200).json({
        message: 'تم رفع صورة التوقيع بنجاح',
        imageUrl: result.secure_url,
        template
    });
});

export {
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    uploadLogo,
    uploadSignature
};
