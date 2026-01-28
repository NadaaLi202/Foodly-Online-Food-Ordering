import { returnModel } from "./returns.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addReturn = catchAsyncError(async (req, res, next) => {
    const returnRequests = new returnModel(req.body);
    await returnRequests.save();

    if (!returnRequests) {
        return next(new AppError('Return request not added', 400));
    }

    res.status(201).json({ message: 'Return request added successfully', returnRequests });
});

const getAllReturns = catchAsyncError(async (req, res, next) => {
    const returns = await returnModel.find().populate('invoice');
    res.status(200).json({ message: 'Returns fetched successfully', returns });
});

const getReturnById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const returnRequest = await returnModel.findById(id).populate('invoice');

    if (!returnRequest) {
        return next(new AppError('Return request not found', 404));
    }

    res.status(200).json({ message: 'Return request fetched successfully', returnRequest });
});

const updateReturn = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const returnRequest = await returnModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!returnRequest) {
        return next(new AppError('Return request not updated', 400));
    }

    res.status(200).json({ message: 'Return request updated successfully', returnRequest });
});

const deleteReturn = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const returnRequest = await returnModel.findByIdAndDelete(id);

    if (!returnRequest) {
        return next(new AppError('Return request not deleted', 400));
    }

    res.status(200).json({ message: 'Return request deleted successfully', returnRequest });
});

export { addReturn, getAllReturns, getReturnById, updateReturn, deleteReturn };
