import { settingsModel } from "./settings.model.js";
import { codingModel } from "../coding/coding.model.js";
import { branchModel } from "../branch/branch.model.js";

/**
 * Get settings for a company by category
 */
export const getSettings = async (companyId, category) => {
    const query = { companyId };
    if (category) {
        query.category = category;
    }
    
    const settings = await settingsModel.find(query);
    
    if (category && settings.length === 0) {
        // Return default empty settings if none exist
        return { category, settings: {} };
    }
    
    if (category) {
        return settings[0] || { category, settings: {} };
    }
    
    // Return all settings grouped by category
    const grouped = {};
    settings.forEach(setting => {
        grouped[setting.category] = setting.settings || {};
    });
    
    return grouped;
};

/**
 * Update or create settings for a company
 */
export const updateSettings = async (companyId, category, settingsData) => {
    const settings = await settingsModel.findOneAndUpdate(
        { companyId, category },
        { 
            companyId, 
            category, 
            settings: settingsData 
        },
        { 
            new: true, 
            upsert: true,
            runValidators: true 
        }
    );
    
    return settings;
};

const getCurrentYearShort = () => new Date().getFullYear().toString().slice(-2);

const normalizeCodingDoc = (doc, branches = []) => {
    const parts = doc?.parts || [];
    const fixedPart = parts.find((p) => p.type === 'fixed');
    const yearPart = parts.find((p) => p.type === 'year');
    const branchPart = parts.find((p) => p.type === 'branch');
    const sequencePart = parts.find((p) => p.type === 'sequence');

    const normalizedBranches = branches.map((branch) => ({
        branchId: branch._id,
        branchName: branch.name,
        currentSequence: Number(doc?.sequences?.get?.(String(branch._id)) ?? doc?.sequences?.[String(branch._id)] ?? 0)
    }));

    return {
        prefix: doc?.prefix || fixedPart?.value || 'INV',
        year: doc?.year || yearPart?.value || getCurrentYearShort(),
        branchScope: doc?.branchScope || (branchPart ? 'branch' : 'global'),
        minDigits: Math.max(1, Number(doc?.minDigits || sequencePart?.length || 6)),
        separator: doc?.separator ?? '-',
        currentSequence: Number(doc?.currentSequence ?? normalizedBranches[0]?.currentSequence ?? 0),
        branchId: doc?.branchId ?? normalizedBranches[0]?.branchId ?? null,
        branchSequences: normalizedBranches
    };
};

export const getCodingSettings = async (companyId, entity = 'invoices') => {
    const [codingDoc, branches] = await Promise.all([
        codingModel.findOne({ companyId, entity }),
        branchModel.find({ companyId }).select('_id name').sort({ createdAt: -1 })
    ]);

    const fallbackDoc = codingDoc || {
        prefix: 'INV',
        year: getCurrentYearShort(),
        branchScope: 'branch',
        minDigits: 6,
        currentSequence: 0,
        branchId: null,
        parts: [
            { type: 'fixed', value: 'INV' },
            { type: 'year', value: getCurrentYearShort() },
            { type: 'branch', value: '' },
            { type: 'sequence', length: 6 }
        ],
        separator: '-',
        sequences: {}
    };

    return normalizeCodingDoc(fallbackDoc, branches);
};

export const updateCodingSettings = async (companyId, payload, entity = 'invoices') => {
    const {
        prefix,
        year,
        branchScope,
        minDigits,
        separator
    } = payload;

    const parts = [
        { type: 'fixed', value: String(prefix || '').trim() },
        { type: 'year', value: String(year || getCurrentYearShort()).trim() }
    ];

    if (branchScope === 'branch') {
        parts.push({ type: 'branch', value: '' });
    }

    parts.push({ type: 'sequence', value: '', length: Number(minDigits) });

    const updatedDoc = await codingModel.findOneAndUpdate(
        { companyId, entity },
        {
            companyId,
            entity,
            parts,
            prefix: String(prefix || '').trim(),
            year: String(year || getCurrentYearShort()).trim(),
            branchScope,
            minDigits: Number(minDigits),
            separator: separator ?? '-'
        },
        { new: true, upsert: true, runValidators: true }
    );

    const branches = await branchModel.find({ companyId }).select('_id name').sort({ createdAt: -1 });
    return normalizeCodingDoc(updatedDoc, branches);
};

export const updateCodingSequence = async (companyId, payload, entity = 'invoices') => {
    const { branchId, sequence } = payload;
    const updatePath = `sequences.${branchId}`;

    await codingModel.findOneAndUpdate(
        { companyId, entity },
        {
            $set: {
                companyId,
                entity,
                [updatePath]: Number(sequence),
                currentSequence: Number(sequence),
                branchId
            },
            $setOnInsert: {
                parts: [
                    { type: 'fixed', value: 'INV' },
                    { type: 'year', value: getCurrentYearShort() },
                    { type: 'branch', value: '' },
                    { type: 'sequence', length: 6 }
                ],
                separator: '-'
            }
        },
        { new: true, upsert: true, runValidators: true }
    );

    return { branchId, currentSequence: Number(sequence) };
};
