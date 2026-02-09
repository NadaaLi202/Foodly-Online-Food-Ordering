import multer from "multer";

export const globalErrorMiddleware = (err, req, res, next) => {
    console.error('[ERROR] Global Error Handler:', err);

    // Handle Multer errors (file size, etc.) with clean messages
    if (err instanceof multer.MulterError) {
        const statusCode = 400;
        let message = "Upload error";
        if (err.code === "LIMIT_FILE_SIZE") {
            message = "File too large. Maximum size is 5MB.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message = "Unexpected field name for file upload.";
        } else {
            message = err.message || message;
        }
        return res.status(statusCode).json({ message, statusCode });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message || "Internal server error", statusCode });
};