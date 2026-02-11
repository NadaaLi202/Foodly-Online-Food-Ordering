import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import Contact from "./contacts.model.js";

// ========== ADD ==========
const addContact = (module) =>
    catchAsyncError(async (req, res, next) => {
        const opData = { ...req.body };
        if (opData.code === "") delete opData.code;
        if (opData.taxNumber === "") delete opData.taxNumber;
        if (opData.commercialRegister === "") delete opData.commercialRegister;

        const { code, taxNumber, commercialRegister } = opData;

        // Check duplicates
        // Check duplicates within company
        // If req.body.companyId is present (it is, explicitly or via middleware), use it.
        const companyId = req.body.companyId;

        if (code) {
            const existingCode = await Contact.findOne({ code, companyId });
            if (existingCode) return next(new AppError("الكود مستخدم بالفعل", 400));
        }
        if (taxNumber) {
            const existingTax = await Contact.findOne({ taxNumber, companyId });
            if (existingTax) return next(new AppError("الرقم الضريبي مستخدم بالفعل", 400));
        }
        if (commercialRegister) {
            const existingCR = await Contact.findOne({ commercialRegister, companyId });
            if (existingCR) return next(new AppError("السجل التجاري مستخدم بالفعل", 400));
        }

        const contact = await Contact.create({
            ...opData,
            module,
            companyId, // Explicitly passed
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
        let filter = {
            module,
            deletedAt: { $eq: null },
            ...req.companyFilter
        };

        const contacts = await Contact.find(filter);
        res.json({
            message: "تم جلب البيانات بنجاح",
            count: contacts.length,
            contacts
        });
    });

// ========== GET ONE ==========
const getContactById = catchAsyncError(async (req, res, next) => {
    const contact = await Contact.findOne({ _id: req.params.id, ...req.companyFilter });

    if (!contact || contact.deletedAt) return next(new AppError("غير موجود", 404));

    res.json({
        message: "تم جلب البيانات بنجاح",
        contact
    });
});

// ========== UPDATE ==========
const updateContact = catchAsyncError(async (req, res, next) => {
    const contact = await Contact.findOne({ _id: req.params.id, ...req.companyFilter });

    if (!contact || contact.deletedAt) return next(new AppError("غير موجود", 404));

    const opData = { ...req.body };
    if (opData.code === "") delete opData.code;
    if (opData.taxNumber === "") delete opData.taxNumber;
    if (opData.commercialRegister === "") delete opData.commercialRegister;

    const { code, taxNumber, commercialRegister } = opData;
    const companyId = contact.companyId; // Use existing contact's companyId for integrity

    // Check duplicates (ignore current record)
    if (code && code !== contact.code) {
        const existingCode = await Contact.findOne({ code, companyId });
        if (existingCode) return next(new AppError("الكود مستخدم بالفعل", 400));
    }
    if (taxNumber && taxNumber !== contact.taxNumber) {
        const existingTax = await Contact.findOne({ taxNumber, companyId });
        if (existingTax) return next(new AppError("الرقم الضريبي مستخدم بالفعل", 400));
    }
    if (commercialRegister && commercialRegister !== contact.commercialRegister) {
        const existingCR = await Contact.findOne({ commercialRegister, companyId });
        if (existingCR) return next(new AppError("السجل التجاري مستخدم بالفعل", 400));
    }

    Object.assign(contact, opData);
    contact.lastModifiedBy = req.user?._id;

    await contact.save();

    res.json({
        message: "تم التعديل بنجاح",
        contact
    });
});

// ========== DELETE ==========
const deleteContact = catchAsyncError(async (req, res, next) => {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, ...req.companyFilter });

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
