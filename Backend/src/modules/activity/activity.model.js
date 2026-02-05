import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const activityModel = mongoose.model('Activity', activitySchema);
