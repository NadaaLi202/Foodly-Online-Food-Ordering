
import { profileModel } from "../../../dataBase/models/profile.model.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { AppError } from "../../utils/AppError.js";

// Add a new profile
const addProfile = catchAsyncError(async (req, res, next) => {

    req.body.image = req.file.filename
    const profile = new profileModel(req.body);
    await profile.save();
    if (!profile) {
        return next(new AppError('Profile not added', 400));
    }
    res.status(201).json({ message: 'Profile created successfully', profile });
});

// Get all profiles
const getAllProfiles = catchAsyncError(async (req, res, next) => {
    const profiles = await profileModel.find();

    if (!profiles) {
        return next(new AppError('Profiles not found', 404));
    }
    res.status(200).json({ message: 'Profiles fetched successfully', profiles });
});

// Get a profile by ID
const getProfileById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const profile = await profileModel.findById(id);

    if (!profile) {
        return next(new AppError('Profile not found', 404));
    }
    res.status(200).json({ message: 'Profile fetched successfully', profile });
});

// Update a profile

const updateProfile = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;



    const profile = await profileModel.findByIdAndUpdate(id, {...req.body,isAuthenticated:true}, { new: true });

    if (!profile) {
        return next(new AppError('Profile not found or not updated', 404));
    }
    res.status(200).json({ message: 'Profile updated successfully', profile });
});

// Delete a profile
const deleteProfile = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const profile = await profileModel.findByIdAndDelete(id);

    if (!profile) {
        return next(new AppError('Profile not found or not deleted', 404));
    }
    res.status(200).json({ message: 'Profile deleted successfully', profile });
});

// Exporting the profile controllers
export { addProfile, getAllProfiles, getProfileById, updateProfile, deleteProfile };