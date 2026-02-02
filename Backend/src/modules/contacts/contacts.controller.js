import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import Contact from "./contacts.model.js";

// ========== ADD ==========
const addContact = (module) =>
    catchAsyncError(async (req, res, next) => {
        const { code, taxNumber, commercialRegister } = req.body;

        // Check duplicates
        if (code) {
            const existingCode = await Contact.findOne({ code });
            if (existingCode) return next(new AppError("الكود مستخدم بالفعل", 400));
        }
        if (taxNumber) {
            const existingTax = await Contact.findOne({ taxNumber });
            if (existingTax) return next(new AppError("الرقم الضريبي مستخدم بالفعل", 400));
        }
        if (commercialRegister) {
            const existingCR = await Contact.findOne({ commercialRegister });
            if (existingCR) return next(new AppError("السجل التجاري مستخدم بالفعل", 400));
        }

        const contact = await Contact.create({
            ...req.body,
            module,
            createdBy: req.user?._id
        });

        res.status(201).json({
            message: "تم الإنشاء بنجاح",
            contact
        });
    });

// ========== GET ALL ==========
const getAllContacts = (module) =>
    catchAsyncError(async (req, res) => {
        const contacts = await Contact.find({
            module,
            deletedAt: { $eq: null }
        });
        res.json({
            message: "تم جلب البيانات بنجاح",
            count: contacts.length,
            contacts
        });
    });

// ========== GET ONE ==========
const getContactById = catchAsyncError(async (req, res, next) => {
    const contact = await Contact.findById(req.params.id);
    if (!contact || contact.deletedAt) return next(new AppError("غير موجود", 404));

    res.json({
        message: "تم جلب البيانات بنجاح",
        contact
    });
});

// ========== UPDATE ==========
const updateContact = catchAsyncError(async (req, res, next) => {
    const contact = await Contact.findById(req.params.id);
    if (!contact || contact.deletedAt) return next(new AppError("غير موجود", 404));

    const { code, taxNumber, commercialRegister } = req.body;

    // Check duplicates (ignore current record)
    if (code && code !== contact.code) {
        const existingCode = await Contact.findOne({ code });
        if (existingCode) return next(new AppError("الكود مستخدم بالفعل", 400));
    }
    if (taxNumber && taxNumber !== contact.taxNumber) {
        const existingTax = await Contact.findOne({ taxNumber });
        if (existingTax) return next(new AppError("الرقم الضريبي مستخدم بالفعل", 400));
    }
    if (commercialRegister && commercialRegister !== contact.commercialRegister) {
        const existingCR = await Contact.findOne({ commercialRegister });
        if (existingCR) return next(new AppError("السجل التجاري مستخدم بالفعل", 400));
    }

    Object.assign(contact, req.body);
    contact.lastModifiedBy = req.user?._id;

    await contact.save();

    res.json({
        message: "تم التعديل بنجاح",
        contact
    });
});

// ========== DELETE ==========
const deleteContact = catchAsyncError(async (req, res, next) => {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return next(new AppError("غير موجود", 404));


    res.json({
        message: "تم الحذف بنجاح",
        contact
    });
});

export {
    addContact,
    getAllContacts,
    getContactById,
    updateContact,
    deleteContact
};
