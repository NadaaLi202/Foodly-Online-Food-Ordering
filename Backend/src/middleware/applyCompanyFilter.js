import { AppError } from "../utils/AppError.js";

export const applyCompanyFilter = (req, res, next) => {
    if (!req.user) {
        return next();
    }

    // 1. SuperAdmin handles everything (optional filter)
    if (req.user.role === "superAdmin") {
        if (req.query.companyId) {
            req.companyFilter = { companyId: req.query.companyId };
        } else {
            req.companyFilter = {};
        }
        return next();
    }

    // 2. Handle 'company' role (Main Account)
    // When a company owner logs in, their 'account' is the company itself.
    if (req.user.role === "company" && !req.user.companyId) {
        req.user.companyId = req.user._id;
    }

    // 3. Strict Check
    if (!req.user.companyId) {
        return next(new AppError("User is not assigned to a company", 403));
    }

    // Attach filter for queries
    req.companyFilter = { companyId: req.user.companyId };

    // Force companyId on create/update (ensure string for validation)
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const id = req.user.companyId;
        req.body.companyId = id != null ? String(id) : undefined;
    }

    next();
};
