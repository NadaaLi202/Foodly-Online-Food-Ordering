import { customerModel } from "../../../dataBase/models/customers(to).model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// Add a new customer
const addCustomer = catchAsyncError(async (req, res, next) => {
    let foundCustomer = await customerModel.findOne({ email: req.body.email });

    if (foundCustomer) {
        return next(new AppError('Customer already exists', 409));
    }

    let customer = new customerModel(req.body);
    await customer.save();
    if(!customer){
        return next(new AppError('Customer not added', 400));
    }
    res.status(200).json({ message: 'Customer added successfully', customer });
});

// Get all customers

const getAllCustomers = catchAsyncError(async (req, res, next) => {
    const { userId } = req.params; // Assuming userId is passed in the URL params

    let customers = await customerModel.find({ user_id: userId });
    if (!customers || customers.length === 0) {
        return next(new AppError('No customers found for this user', 404));
    }
    
    res.status(200).json({ message: 'Customers fetched successfully', customers });
});




// Get a customer by ID
const getCustomerById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let customer = await customerModel.findById(id);

    if (!customer) {
        return next(new AppError('Customer not found', 400));
    }
    res.status(200).json({ message: 'Customer fetched successfully', customer });
});

// Update a customer
const updateCustomer = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    // req.body.logo = req.file.filename
    let customer = await customerModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!customer) {
        return next(new AppError('Customer not updated', 400));
    }
    res.status(200).json({ message: 'Customer updated successfully', customer });
});

// Delete a customer
const deleteCustomer = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    let customer = await customerModel.findByIdAndDelete(id);

    if (!customer) {
        return next(new AppError('Customer not deleted', 400));
    }
    res.status(200).json({ message: 'Customer deleted successfully', customer });
});

// Exporting the customer controllers
export { addCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer };