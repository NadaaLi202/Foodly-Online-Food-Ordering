import { AppError } from "../utils/AppError.js";

const isSuperAdminUser = (user) =>
    user?.role === "superAdmin" || user?.systemRole === "superAdmin";

const firstDefined = (...vals) => vals.find(v => v !== undefined && v !== null && String(v).trim() !== "");

export const resolveCompanyIdForWrite = (req) => {
    const candidate = firstDefined(
        req?.companyFilter?.companyId,
        req?.body?.companyId,
        req?.query?.companyId,
        req?.headers?.["x-company-id"],
        req?.user?.companyId
    );
    return candidate ? String(candidate) : null;
};

export const applyCompanyFilter = (req, res, next) => {
    if (!req.user) {
        return next();
    }
    req.isSuperAdmin = isSuperAdminUser(req.user);

    // 1. Handle 'company' role (Main Account)
    // When a company owner logs in, their 'account' is the company itself.
    if (req.user.role === "company" && !req.user.companyId) {
        req.user.companyId = req.user._id;
    }

    // 2. SuperAdmin handles everything (optional filter)
    if (req.isSuperAdmin) {
        const targetCompanyId = firstDefined(req.query.companyId, req.body.companyId, req.headers["x-company-id"]);
        if (targetCompanyId) {
            const normalized = String(targetCompanyId);
            req.companyFilter = { companyId: normalized };
            req.user.companyId = normalized;
            if (["POST", "PUT", "PATCH"].includes(req.method)) {
                req.body.companyId = normalized;
            }
        } else {
            req.companyFilter = {};
        }
        next();
        return;
    }

    // 3. Strict Check for regular users
    if (!req.user.companyId) {
        return next(new AppError("User is not assigned to a company", 403));
    }

    // Attach filter for queries
    req.companyFilter = { companyId: req.user.companyId };

    // Force companyId on create/update (ensure string for validation)
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
        const id = resolveCompanyIdForWrite(req);
        if (id) {
            req.body.companyId = id;
        }
    }

    next();
};
