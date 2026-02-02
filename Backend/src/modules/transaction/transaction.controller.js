import Transaction from "./transaction.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

const createTransaction = (module, documentType) =>
    catchAsyncError(async (req, res) => {
        const transaction = await Transaction.create({
            ...req.body,
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

    Object.assign(doc, req.body);
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
