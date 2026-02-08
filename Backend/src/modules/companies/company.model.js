import mongoose from "mongoose";
import bcrypt from "bcrypt";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        unique: [true, 'Company name already in use'],
        minLength: [2, 'Company name must be at least 2 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        unique: [true, 'Email already in use'],
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [6, 'Password must be at least 6 characters']
    },
    phone: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    logo: {
        url: {
            type: String,
            default: ''
        },
        publicId: {
            type: String,
            default: ''
        }
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active'
    },
    subscriptionEndDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Pre-save hook for password hashing and slug generation
companySchema.pre('save', function (next) {
    // Hash password if modified
    if (this.isModified('password')) {
        this.password = bcrypt.hashSync(this.password, 10);
    }

    // Generate slug from name if not present or name modified
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w\u0621-\u064A\s-]/g, '') // Remove non-word chars (keeping Arabic, spaces, hyphens)
            .replace(/\s+/g, '-')       // Replace spaces with -
            .replace(/^-+|-+$/g, '');   // Trim - from start/end

        // Append random string to ensure uniqueness if needed, 
        // but for now relying on unique name constraint mostly.
        // A better approach for robust slugs usually involves async check, 
        // but this simple synchronous version fits the basic requirement.
    }

    next();
});

export const companyModel = mongoose.model('Company', companySchema);
