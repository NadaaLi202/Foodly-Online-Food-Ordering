import multer from "multer";
import { AppError } from "../utils/AppError.js";

// shared upload options
const uploadOptions = (fileTypes) => {
    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
        // Check if file type is allowed (starts with any of the allowed types)
        // Common fileTypes: ['image', 'application/pdf']
        const isAllowed = fileTypes.some((type) =>
            file.mimetype.startsWith(type)
        );

        if (isAllowed) {
            cb(null, true);
        } else {
            cb(new AppError("File type is not allowed", 400));
        }
    };

    return multer({
        storage,
        fileFilter,
    });
};

// upload single file
export const uploadSingleFile = (fileTypes, fieldName) =>
    uploadOptions(fileTypes).single(fieldName);

// upload multiple files
export const uploadMultiFiles = (fileTypes, fields) =>
    uploadOptions(fileTypes).fields(fields);

