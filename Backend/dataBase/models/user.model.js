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
        unique: [true, 'User email must be unique'],
        lowercase: true,
    },

    password: {
        type: String,
        required: true,
        minLength: [6, 'User password must be at least 6 characters long'],
        maxLength: [30, 'User password must be at most 30 characters long']
    },
    confirmPassword: {
        type: String,
        required: true,
        minLength: [6, 'User password must be at least 6 characters long'],
        maxLength: [30, 'User password must be at most 30 characters long']
    },

    role: {
        type: String,
        enum: ["accountant", "admin", "employee", "user"],
        default: "user",
        required: true
    },
    image: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    }
}, { timestamps: true })



userSchema.pre('save', function (next) {
    if (this.isModified('password')) {


        this.password = bcrypt.hashSync(this.password, 10)
    }
    next();
})

userSchema.post('init', (doc) => {
    doc.image = "http://localhost:4000/user/" + doc.image

})


export const userModel = mongoose.model('user', userSchema)