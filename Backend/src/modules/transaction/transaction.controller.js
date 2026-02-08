import Transaction from "./transaction.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";

const createTransaction = (module, documentType) =>
    catchAsyncError(async (req, res, next) => {
        console.log(`[DEBUG] createTransaction called for ${module}/${documentType}`);
        const opData = { ...req.body };
        const companyId = req.user.companyId;

        // Check transactionNumber uniqueness per company
        if (opData.transactionNumber) {
            const existing = await Transaction.findOne({
                transactionNumber: opData.transactionNumber,
                companyId: companyId
            });
            if (existing) {
                return next(new AppError("رقم المعاملة موجود بالفعل", 409));
            }
        }

        // Handle file uploads
        if (req.files && req.files.attachments) {
            const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'transactions'));
            const results = await Promise.all(uploadPromises);
            opData.attachments = results.map((result, index) => ({
                fileName: req.files.attachments[index].originalname,
                fileUrl: result.secure_url,
                publicId: result.public_id,
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
            companyId, // Ensure companyId is saved
            createdBy: req.user?._id
        });

        res.status(201).json({
            message: "تم الإنشاء بنجاح",
            transaction
        });
    });

const getAllTransactions = (module, documentType) =>
    catchAsyncError(async (req, res) => {
        const query = {
            module,
            documentType,
            deletedAt: { $eq: null },
            ...req.companyFilter
        };

        const data = await Transaction.find(query)
            .populate('contact', 'name email phone type')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ results: data.length, data });
    });

const getOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findOne({ _id: req.params.id, ...req.companyFilter })
        .populate('contact', 'name email phone type address')
        .populate('items.product', 'name sellingPrice');
    if (!doc) return next(new AppError("غير موجود", 404));
    res.json(doc);
});

const updateOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!doc) return next(new AppError("غير موجود", 404));

    const opData = { ...req.body };

    // Check transactionNumber uniqueness if changed
    if (opData.transactionNumber && opData.transactionNumber !== doc.transactionNumber) {
        const existing = await Transaction.findOne({
            transactionNumber: opData.transactionNumber,
            companyId: doc.companyId
        });
        if (existing) {
            return next(new AppError("رقم المعاملة موجود بالفعل", 409));
        }
    }

    // Handle file uploads
    if (req.files && req.files.attachments) {
        const uploadPromises = req.files.attachments.map(file => uploadToCloudinary(file.buffer, 'transactions'));
        const results = await Promise.all(uploadPromises);
        const newAttachments = results.map((result, index) => ({
            fileName: req.files.attachments[index].originalname,
            fileUrl: result.secure_url,
            publicId: result.public_id,
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
    // Protect companyId
    if (req.companyFilter.companyId) {
        doc.companyId = req.companyFilter.companyId;
    }
    doc.lastModifiedBy = req.user?._id;

    await doc.save(); // ✅ يشغّل pre('save')

    res.json({
        message: "تم التعديل بنجاح",
        data: doc
    });
});

const deleteOne = catchAsyncError(async (req, res, next) => {
    const doc = await Transaction.findOne({ _id: req.params.id, ...req.companyFilter });
    if (!doc) return next(new AppError("غير موجود", 404));

    // Soft delete
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
