import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { requisitionModel } from "./requisition.model.js";

// Add Requisition
export const addRequisition = catchAsyncError(async (req, res) => {
    const requisition = new requisitionModel({
        ...req.body,
        companyId: req.user.companyId
    });
    await requisition.save();

    res.status(201).json({
        message: "تم إضافة الإذن بنجاح",
        requisition
    });
});

// Get All Requisitions
export const getAllRequisitions = catchAsyncError(async (req, res) => {
    const requisitions = await requisitionModel.find(req.companyFilter).sort({ createdAt: -1 });

    res.status(200).json({
        message: "تم جلب الأذونات بنجاح",
        requisitions
    });
});

// Get By ID
export const getRequisitionById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const requisition = await requisitionModel.findOne({ _id: id, ...req.companyFilter });

    if (!requisition) {
        return next(new AppError("الإذن غير موجود", 404));
    }

    res.status(200).json({
        message: "تم جلب الإذن بنجاح",
        requisition
    });
});

// Update Requisition
export const updateRequisition = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const requisition = await requisitionModel.findOneAndUpdate(
        { _id: id, ...req.companyFilter },
        req.body,
        { new: true }
    );

    if (!requisition) {
        return next(new AppError("الإذن غير موجود", 404));
    }

    res.status(200).json({
        message: "تم تحديث الإذن بنجاح",
        requisition
    });
});

// Delete Requisition
export const deleteRequisition = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const requisition = await requisitionModel.findOneAndDelete({ _id: id, ...req.companyFilter });

    if (!requisition) {
        return next(new AppError("الإذن غير موجود", 404));
    }

    res.status(200).json({
        message: "تم حذف الإذن بنجاح",
        requisition
    });
});
