import { codingModel } from "./coding.model.js";
import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";

// ========== GET RULES ==========
export const getCodingRules = catchAsyncError(async (req, res, next) => {
    const { entity } = req.params;
    const companyId = req.user.companyId;

    let rules = await codingModel.findOne({ companyId, entity });

    // If no rules exist, return a default rule
    if (!rules) {
        rules = {
            entity,
            parts: [
                { type: 'fixed', value: 'INV' },
                { type: 'year', value: '' },
                { type: 'branch', value: '' },
                { type: 'sequence', value: '', length: 6 }
            ],
            separator: '-',
            sequences: {}
        };
    }

    res.status(200).json({ message: "Rules fetched successfully", rules });
});

// ========== UPDATE RULES ==========
export const updateCodingRules = catchAsyncError(async (req, res, next) => {
    const { entity } = req.params;
    const { parts, separator } = req.body;
    const companyId = req.user.companyId;

    const rules = await codingModel.findOneAndUpdate(
        { companyId, entity },
        { parts, separator },
        { new: true, upsert: true }
    );

    res.status(200).json({ message: "Rules updated successfully", rules });
});

// ========== UPDATE BRANCH SEQUENCE ==========
export const updateBranchSequence = catchAsyncError(async (req, res, next) => {
    const { entity } = req.params;
    const { branchId, sequence } = req.body;
    const companyId = req.user.companyId;

    const updateQuery = {};
    updateQuery[`sequences.${branchId}`] = sequence;

    const rules = await codingModel.findOneAndUpdate(
        { companyId, entity },
        { $set: updateQuery },
        { new: true, upsert: true }
    );

    res.status(200).json({ message: "Sequence updated successfully", rules });
});
