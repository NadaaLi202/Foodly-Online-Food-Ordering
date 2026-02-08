import mongoose from "mongoose";
import bcrypt from "bcrypt"



const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        minLength: [3, 'User name must be at least 3 characters long'],
        maxLength: [30, 'User name must be at most 30 characters long']
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
        minLength: [6, 'User password must be at least 6 characters long'],
        maxLength: [30, 'User password must be at most 30 characters long']
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [
            function () { return this.role !== 'superAdmin'; },
            'Company ID is required for non-superAdmin users'
        ]
    },
    role: {
        type: String,
        enum: ["superAdmin", "admin", "accountant", "employee"],
        default: "employee",
        required: true
    },
    image: {
        type: String,
        trim: true
    },
    imagePublicId: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    }
}, { timestamps: true })

userSchema.index({ email: 1, companyId: 1 }, { unique: true });



userSchema.pre('save', function (next) {
    if (this.isModified('password')) {


        this.password = bcrypt.hashSync(this.password, 10)
    }
    next();
})

// userSchema.post('init', (doc) => {
//     doc.image = "http://localhost:4000/user/" + doc.image
// })


export const userModel = mongoose.model('user', userSchema)