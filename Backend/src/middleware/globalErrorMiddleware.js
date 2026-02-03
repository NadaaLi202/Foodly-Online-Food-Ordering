

export const globalErrorMiddleware = (err, req, res, next) => {
    console.error('[ERROR] Global Error Handler:', err); // Log the full error
    const statusCode = err.statusCode || 500
    res.status(statusCode).json({ message: err.message, statusCode })
}