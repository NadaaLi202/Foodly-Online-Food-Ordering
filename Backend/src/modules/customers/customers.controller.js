import { salesCustomerModel } from "./customers.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

const addCustomer = catchAsyncError(async (req, res, next) => {
    const existingCustomer = await salesCustomerModel.findOne({ email: req.body.email });
    if (existingCustomer) {
        return next(new AppError('Customer already exists', 409));
    }

    const customer = new salesCustomerModel(req.body);
    await customer.save();

    if (!customer) {
        return next(new AppError('Customer not added', 400));
    }

    res.status(201).json({ message: 'Customer added successfully', customer });
});

const getAllCustomers = catchAsyncError(async (req, res, next) => {
    const customers = await salesCustomerModel.find();
    res.status(200).json({ message: 'Customers fetched successfully', customers });
});

const getCustomerById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const customer = await salesCustomerModel.findById(id);

    if (!customer) {
        return next(new AppError('Customer not found', 404));
    }

    res.status(200).json({ message: 'Customer fetched successfully', customer });
});

const updateCustomer = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const customer = await salesCustomerModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!customer) {
        return next(new AppError('Customer not updated', 400));
    }

    res.status(200).json({ message: 'Customer updated successfully', customer });
});

const deleteCustomer = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const customer = await salesCustomerModel.findByIdAndDelete(id);

    if (!customer) {
        return next(new AppError('Customer not deleted', 400));
    }

    res.status(200).json({ message: 'Customer deleted successfully', customer });
});

export { addCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer };
