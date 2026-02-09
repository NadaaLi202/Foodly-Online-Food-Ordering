import { userModel } from "../user/user.model.js"
import { companyModel } from "../companies/company.model.js"
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

    // 1. Check User model
    let account = await userModel.findOne({ email });
    let type = 'user';

    // 2. If not found, check Company model
    if (!account) {
        account = await companyModel.findOne({ email });
        type = 'company';
    }

    if (!account) {
        return next(new AppError('invalid email or password', 404));
    }

    // 3. Compare password
    const match = await bcrypt.compare(password, account.password);

    if (match) {
        const payload = {
            userId: account._id,
            role: type === 'company' ? 'company' : account.role,
            type: type
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
    const match = await bcrypt.compare(password, company.password);
    if (!match) {
        return next(new AppError('Invalid email or password', 401));
    }
    const payload = {
        userId: company._id,
        companyId: company._id,
        role: 'company'
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

    req.user = account;
    next();
})

const allowedTo = (...roles) => { // Authorization
    return catchAsyncError(async (req, res, next) => {
        // If it's a company account, allow if 'admin' is in the allowed roles
        const userRole = req.user.role;
        const isAuthorized = roles.includes(userRole) || (userRole === 'company' && roles.includes('admin'));

        if (!isAuthorized)
            return next(new AppError('you are not authorized to access this route . you are ' + userRole, 401))

        next()
    })
}



export { signup, signIn, companySignIn, protectedRoutes, allowedTo }



