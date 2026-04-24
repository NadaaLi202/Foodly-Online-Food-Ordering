import logError from "../utils/logerror.js";

export const catchAsyncError = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (err) {
            // Controller-level debug logging for 5xx investigations
            try {
                const context = {
                    method: req.method,
                    url: req.originalUrl || req.url,
                    params: req.params,
                    query: req.query,
                    body: req.body,
                    userId: req.user?._id || null,
                };
                logError("[CONTROLLER ERROR]", { context, error: { message: err.message, stack: err.stack } });
            } catch {
                // Avoid logging failures breaking the error flow
            }
            next(err);
        }
    };
};