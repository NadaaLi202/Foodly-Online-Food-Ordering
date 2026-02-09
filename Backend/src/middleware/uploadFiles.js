import multer from "multer";
import { AppError } from "../utils/AppError.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// shared upload options
const uploadOptions = (fileTypes) => {
    const storage = multer.memoryStorage();

    const fileFilter = (req, file, cb) => {
        // Use mimetype validation (e.g. image/jpeg, image/png, image/webp)
        const isAllowed = fileTypes.some((type) =>
            file.mimetype.startsWith(type)
        );

        if (isAllowed) {
            cb(null, true);
        } else {
            const message = fileTypes.includes("image")
                ? "Only image files are allowed"
                : "File type is not allowed";
            cb(new AppError(message, 400));
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: MAX_FILE_SIZE },
    });
};

// upload single file
export const uploadSingleFile = (fileTypes, fieldName) =>
    uploadOptions(fileTypes).single(fieldName);

// upload multiple files
export const uploadMultiFiles = (fileTypes, fields) =>
    uploadOptions(fileTypes).fields(fields);

