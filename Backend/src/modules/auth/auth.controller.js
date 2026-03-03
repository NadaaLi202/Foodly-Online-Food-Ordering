import { userModel } from "../user/user.model.js"
import { companyModel } from "../companies/company.model.js"
import { roleModel } from "../role/role.model.js"
import { catchAsyncError } from "../../middleware/catchAsyncError.js"
import { AppError } from "../../utils/AppError.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"




const signup = catchAsyncError(async (req, res, next) => {
    let isUserExist = await userModel.findOne({ email: req.body.email })

    if (isUserExist) {
        return next(new AppError('User already exist', 409))
    }

    // Remove confirmPassword before saving (should not be stored)
    const { confirmPassword, ...userData } = req.body;

    // Validate companyId for non-superAdmin users
    if (userData.role !== 'superAdmin' && !userData.companyId) {
        return next(new AppError('Company ID is required for non-superAdmin users', 400))
    }

    let user = new userModel(userData)
    await user.save()
    res.status(200).json({ message: 'User added successfully', user })
})



const signIn = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;

    // Normalize email to match how it is stored in the DB (both User and Company schemas use lowercase)
    const normalizedEmail = typeof email === 'string'
        ? email.trim().toLowerCase()
        : email;

    // [DEBUG] Temporary signIn logs – remove after verifying credentials
    const debug = process.env.SIGNIN_DEBUG === 'true';
    if (debug) {
        console.log('[signIn] normalizedEmail:', normalizedEmail);
    }

    // 1. Check User model
    let account = await userModel.findOne({ email: normalizedEmail });
    let type = 'user';

    // 2. If not found, check Company model
    if (!account) {
        account = await companyModel.findOne({ email: normalizedEmail });
        type = 'company';
    }

    if (debug) {
        console.log('[signIn] account found:', !!account, 'type:', account ? type : 'none');
    }

    if (!account) {
        return next(new AppError('invalid email or password', 404));
    }

    if (type === 'company' && account.status && account.status !== 'active') {
        const statusMsg = account.status === 'pending' ? 'حسابك قيد المراجعة، سيتم إشعارك بعد موافقة الإدارة' : 'عذرا، لقد تم رفض طلب تسجيل حسابكم.';
        return next(new AppError(statusMsg, 403));
    }

    // 3. Compare password
    const match = await bcrypt.compare(password, account.password);

    if (debug) {
        const hasHash = !!account.password && String(account.password).startsWith('$2');
        console.log('[signIn] password compare:', match, '| stored looks like bcrypt:', hasHash);
    }

    if (match) {
        const isSuperAdminUser = type === 'user' && (account.role === 'superAdmin' || account.systemRole === 'superAdmin');
        const payload = {
            userId: account._id,
            role: type === 'company' ? 'company' : account.role,
            type: type,
            systemRole: type === 'company' ? 'companyOwner' : (isSuperAdminUser ? 'superAdmin' : null),
            roleId: type === 'user' ? (account.roleId || null) : null
        };

        if (type === 'user') {
            payload.companyId = account.companyId || null;
        } else {
            payload.companyId = account._id;
        }

        let token = jwt.sign(payload, process.env.SECRET_KEY);

        // Prepare account object for response (remove password)
        const accountResponse = account.toObject();
        delete accountResponse.password;

        // Ensure role is present for frontend
        if (type === 'company') {
            accountResponse.role = 'company';
        } else {
            accountResponse.systemRole = (accountResponse.role === 'superAdmin' || accountResponse.systemRole === 'superAdmin')
                ? 'superAdmin'
                : null;
        }

        return res.status(200).json({
            message: `${type === 'company' ? 'Company' : 'User'} login successfully`,
            isUserExist: accountResponse,
            token
        });
    }

    return next(new AppError('invalid email or password', 401));
})

// Dedicated company login (public) – returns JWT scoped to company
const companySignIn = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    const company = await companyModel.findOne({ email: email?.toLowerCase?.() || email });
    if (!company) {
        return next(new AppError('Invalid email or password', 401));
    }

    if (company.status && company.status !== 'active') {
        const statusMsg = company.status === 'pending' ? 'حسابك قيد المراجعة، سيتم إشعارك بعد موافقة الإدارة' : 'عذرا، لقد تم رفض طلب تسجيل حسابكم.';
        return next(new AppError(statusMsg, 403));
    }

    const match = await bcrypt.compare(password, company.password);
    if (!match) {
        return next(new AppError('Invalid email or password', 401));
    }
    const payload = {
        userId: company._id,
        companyId: company._id,
        role: 'company',
        systemRole: 'companyOwner',
        roleId: null
    };
    const token = jwt.sign(payload, process.env.SECRET_KEY);
    const companyResponse = company.toObject();
    delete companyResponse.password;
    companyResponse.role = 'company';
    return res.status(200).json({
        message: 'Company login successful',
        company: companyResponse,
        token
    });
});

const protectedRoutes = catchAsyncError(async (req, res, next) => { // authentication 
    let { token } = req.headers;
    if (!token) {
        token = req.headers.authorization?.split(' ')[1]; // Check Bearer token too
    }

    if (!token) return next(new AppError('Token not provided', 401));

    let decoded;
    try {
        decoded = await jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        return next(new AppError('Invalid or expired token', 401));
    }

    // Try finding in userModel first
    let account = await userModel.findById(decoded.userId);

    // If not found, try companyModel
    if (!account) {
        account = await companyModel.findById(decoded.userId);
        if (account) {
            // Convert to object to add role if missing in schema
            account = account.toObject();
            account.role = account.role || 'company';
        }
    }

    if (!account) return next(new AppError('Account not found or invalid token', 401));

    req.user = typeof account.toObject === 'function' ? account.toObject() : account;
    if (decoded.systemRole) req.user.systemRole = decoded.systemRole;
    if (decoded.roleId) req.user.roleId = decoded.roleId;
    if (decoded.companyId) req.user.companyId = decoded.companyId; // Ensure companyId from token is restored
    if (req.user.role !== 'superAdmin' && req.user.role !== 'company') {
        req.user.systemRole = null;
    }
    next();
})

const allowedTo = (...roles) => { // Authorization (role-based, backward compatible)
    return catchAsyncError(async (req, res, next) => {
        const userRole = req.user?.role;
        const isAuthorized = roles.includes(userRole) || (userRole === 'company' && roles.includes('admin'));

        if (!isAuthorized)
            return next(new AppError('you are not authorized to access this route . you are ' + (userRole || 'unknown'), 403));

        next();
    });
}

const RBAC_DEBUG_ENABLED = String(process.env.RBAC_DEBUG || "").toLowerCase() === "true";
const rbacDebugLog = (payload) => {
    if (!RBAC_DEBUG_ENABLED) return;
    try {
        console.log("[RBAC_DEBUG]", JSON.stringify(payload));
    } catch {
        console.log("[RBAC_DEBUG]", payload);
    }
};

/**
 * Permission-based authorization. Allow if:
 * - systemRole is superAdmin, or
 * - role is company (legacy company-account bypass), or
 * - user's role (by roleId) has at least one of the given permissions and is active.
 * @param {...string} permissions - One or more permission strings; user needs at least one.
 */
const enforcePermissions = async (req, next, permissions = []) => {
    const systemRole = req.user?.systemRole;
    const role = req.user?.role;
    const normalizedRequired = (permissions || [])
        .filter(Boolean)
        .map((p) => String(p).trim().toLowerCase());

    rbacDebugLog({
        stage: "start",
        path: req.originalUrl,
        method: req.method,
        userId: req.user?._id || null,
        role,
        systemRole,
        roleId: req.user?.roleId || null,
        requiredPermissions: normalizedRequired,
    });

    if (!role) {
        return next(new AppError('User role context is missing', 403));
    }

    // System-level bypass for super admin only.
    if (systemRole === 'superAdmin' || role === 'superAdmin') {
        rbacDebugLog({ stage: "bypass", reason: "superAdmin" });
        return true;
    }

    // Legacy company-account bypass (for direct company login account only).
    if (role === 'company') {
        rbacDebugLog({ stage: "bypass", reason: "company-account" });
        return true;
    }

    const roleId = req.user?.roleId;
    if (!roleId) {
        return next(new AppError('No role assigned to this user', 403));
    }

    // Cache role doc for this request to avoid repeated DB reads per route.
    if (!req._resolvedRoleDoc) {
        req._resolvedRoleDoc = await roleModel.findById(roleId).lean();
    }
    const roleDoc = req._resolvedRoleDoc;

    if (!roleDoc) {
        return next(new AppError('Assigned role not found', 403));
    }
    if (roleDoc.status !== 'active') {
        return next(new AppError('Assigned role is inactive', 403));
    }

    // Tenant safety: regular users can only use roles from their own company.
    if (
        req.user?.companyId &&
        roleDoc.companyId &&
        String(roleDoc.companyId) !== String(req.user.companyId)
    ) {
        return next(new AppError('Role does not belong to the user company', 403));
    }

    const userPerms = Array.isArray(roleDoc.permissions)
        ? roleDoc.permissions.map((p) => String(p).trim().toLowerCase())
        : [];
    const required = normalizedRequired;

    if (required.length === 0) {
        return next(new AppError('Forbidden: no permission configured for this operation', 403));
    }

    const matchedPermissionKey = required.find((p) => userPerms.includes(p)) || null;
    const hasAny = Boolean(matchedPermissionKey);

    rbacDebugLog({
        stage: "evaluate",
        userId: req.user?._id || null,
        role: req.user?.role,
        roleName: roleDoc?.name || null,
        roleId,
        resolvedAction: req.rbacResolvedAction || null,
        resolvedModule: req.rbacResolvedModule || null,
        matchedPermissionKey,
        requiredPermissions: required,
        userPermissionsCount: userPerms.length,
        userPermissions: userPerms,
    });

    if (!hasAny) {
        rbacDebugLog({
            stage: "decision",
            userId: req.user?._id || null,
            roleId,
            resolvedAction: req.rbacResolvedAction || null,
            resolvedModule: req.rbacResolvedModule || null,
            allowed: false,
        });
        return next(new AppError('Forbidden: insufficient role permissions', 403));
    }

    rbacDebugLog({
        stage: "decision",
        userId: req.user?._id || null,
        roleId,
        resolvedAction: req.rbacResolvedAction || null,
        resolvedModule: req.rbacResolvedModule || null,
        allowed: true,
    });
    return true;
};

const requirePermission = (...permissions) => {
    return catchAsyncError(async (req, res, next) => {
        const ok = await enforcePermissions(req, next, permissions);
        if (ok !== true) return;
        return next();
    });
};

/**
 * Resolve permissions dynamically per request (module/resource specific),
 * then enforce them using the same role checks used by requirePermission().
 * @param {(req: import('express').Request) => Promise<string[]|string>|string[]|string} resolver
 */
const requireResolvedPermission = (resolver) => {
    return catchAsyncError(async (req, res, next) => {
        const resolved = await resolver(req);
        const permissions = Array.isArray(resolved) ? resolved : [resolved];
        rbacDebugLog({
            stage: "resolved",
            path: req.originalUrl,
            method: req.method,
            role: req.user?.role,
            resolvedPermissions: permissions.filter(Boolean),
            resolvedModule: req.rbacResolvedModule || null,
            resolvedAction: req.rbacResolvedAction || null,
        });
        const ok = await enforcePermissions(req, next, permissions.filter(Boolean));
        if (ok !== true) return;
        return next();
    });
};

const METHOD_TO_ACTION = {
    GET: "view",
    POST: "add",
    PUT: "edit",
    PATCH: "edit",
    DELETE: "delete",
};

const requireResourcePermission = (moduleKey, options = {}) => {
    const actionOverride = options.action;
    const actionMap = options.actionMap || METHOD_TO_ACTION;
    return requireResolvedPermission((req) => {
        const action = actionOverride || actionMap[req.method] || "view";
        const permission = moduleKey ? `${moduleKey}:${action}` : null;
        req.rbacResolvedModule = moduleKey;
        req.rbacResolvedAction = action;
        return permission;
    });
};

export {
    signup,
    signIn,
    companySignIn,
    protectedRoutes,
    allowedTo,
    requirePermission,
    requireResolvedPermission,
    requireResourcePermission
}



