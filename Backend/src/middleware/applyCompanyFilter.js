import { AppError } from "../utils/apperror.js";

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

export const applyCompanyFilter = async (req, res, next) => {
    if (!req.user) {
        return next();
    }
    req.isSuperAdmin = isSuperAdminUser(req.user);

    // 1) SuperAdmin: Bypass ALL company filtering (unrestricted access)
    if (req.isSuperAdmin || req.user.role === "superAdmin") {
        req.companyFilter = {};

        const targetCompanyId = resolveCompanyIdForWrite(req);
        if (targetCompanyId) {
            req.body.companyId = targetCompanyId;
            req.companyFilter.companyId = targetCompanyId; // Ensure GET requests also use the filter
        } else {
            try {
                const { companyModel } = await import("../modules/companies/company.model.js");
                const firstCompany = await companyModel.findOne().select('_id').lean();
                if (firstCompany) {
                    const cid = String(firstCompany._id);
                    req.body.companyId = cid;
                    req.user.companyId = cid;
                    req.companyFilter.companyId = cid;
                }
            } catch (err) {
                console.error("SuperAdmin company fallback error:", err);
            }
        }

        return next();
    }

    // 2) Company Role: strictly enforce own company, no override allowed
    if (req.user.role === "company") {
        const companyId = String(req.user.companyId || req.user._id);
        req.user.companyId = companyId;
        req.companyFilter = { companyId: companyId };

        if (["POST", "PUT", "PATCH"].includes(req.method)) {
            req.body.companyId = companyId;
        }
        return next();
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
