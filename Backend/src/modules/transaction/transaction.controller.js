import Transaction from "./transaction.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

const createTransaction = (module, documentType) =>
    catchAsyncError(async (req, res) => {
        console.log(`[DEBUG] createTransaction called for ${module}/${documentType}`);
        console.log('[DEBUG] req.body:', JSON.stringify(req.body));
        const opData = { ...req.body };

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            opData.attachments = req.files.map(file => ({
                fileName: file.originalname,
                fileUrl: `/uploads/products/${file.filename}`, // Assuming this is the standard upload path
                uploadedAt: new Date()
            }));
        }

        // Parse items if they are sent as a JSON string (using FormData)
        if (typeof opData.items === 'string') {
            try {
                opData.items = JSON.parse(opData.items);
            } catch (e) {
                console.error("Error parsing items JSON:", e);
            }
        }

        const transaction = await Transaction.create({
            ...opData,
            module,
            documentType,
            createdBy: req.user?._id
        });

        res.status(201).json({
            message: "تم الإنشاء بنجاح",
            transaction
        });
    });

const getAllTransactions = (module, documentType) =>
    catchAsyncError(async (req, res) => {
        // const data = await Transaction.find({ module, documentType });
        const data = await Transaction.find({
            module,
            documentType,
            deletedAt: { $eq: null }
        });


        res.json({ results: data.length, data });
    });

const getOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findById(req.params.id);
    if (!doc) return next(new AppError("غير موجود", 404));
    res.json(doc);
});

const updateOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findById(req.params.id);
    if (!doc) return next(new AppError("غير موجود", 404));

    const opData = { ...req.body };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
        const newAttachments = req.files.map(file => ({
            fileName: file.originalname,
            fileUrl: `/uploads/products/${file.filename}`,
            uploadedAt: new Date()
        }));
        doc.attachments = [...(doc.attachments || []), ...newAttachments];
    }

    // Parse items if they are sent as a JSON string
    if (typeof opData.items === 'string') {
        try {
            opData.items = JSON.parse(opData.items);
        } catch (e) {
            console.error("Error parsing items JSON:", e);
        }
    }

    Object.assign(doc, opData);
    doc.lastModifiedBy = req.user?._id;

    await doc.save(); // ✅ يشغّل pre('save')

    res.json({
        message: "تم التعديل بنجاح",
        data: doc
    });
});


// const deleteOne = catchAsyncError(async (req, res, next) => {
//     const doc = await Transaction.findByIdAndDelete(req.params.id);
//     if (!doc) return next(new AppError("غير موجود", 404));
//     res.json({ message: "تم الحذف", data: doc });
// });


const deleteOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findById(req.params.id);
    if (!doc) return next(new AppError("غير موجود", 404));

    doc.deletedAt = new Date();
    doc.deletedBy = req.user?._id;
    await doc.save();

    res.json({ message: "تم الحذف" });
});


export {
    createTransaction,
    getAllTransactions,
    getOne,
    updateOne,
    deleteOne
};
