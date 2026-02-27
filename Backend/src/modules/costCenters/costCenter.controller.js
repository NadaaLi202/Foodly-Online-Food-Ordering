import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { costCenterModel } from "./costCenter.model.js";

const normalizeOptionalId = (value) => {
    if (value === undefined || value === null || value === '') return null;
    return value;
};

const normalizeName = (value = '') =>
    String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

const normalizeArabic = (value = '') =>
    String(value)
        .replace(/[\u064B-\u0652]/g, '')
        .replace(/\u0640/g, '')
        .replace(/[\u0623\u0625\u0622]/g, '\u0627')
        .replace(/\u0649/g, '\u064a')
        .replace(/\u0629/g, '\u0647')
        .trim();

const normalizeLookupValue = (value = '') => normalizeArabic(normalizeName(value));

const MAIN_CATEGORY_DEFINITIONS = [
    {
        key: 'projects',
        labelEn: 'Projects',
        labelAr: '\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639',
        aliases: ['projects', 'project', '\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639', '\u0645\u0634\u0627\u0631\u064a\u0639']
    },
    {
        key: 'departments',
        labelEn: 'Departments',
        labelAr: '\u0627\u0644\u0623\u0642\u0633\u0627\u0645',
        aliases: ['departments', 'department', '\u0627\u0644\u0623\u0642\u0633\u0627\u0645', '\u0627\u0644\u0627\u0642\u0633\u0627\u0645', '\u0623\u0642\u0633\u0627\u0645', '\u0627\u0642\u0633\u0627\u0645']
    },
    {
        key: 'activities',
        labelEn: 'Activities',
        labelAr: '\u0627\u0644\u0623\u0646\u0634\u0637\u0629',
        aliases: ['activities', 'activity', '\u0627\u0644\u0623\u0646\u0634\u0637\u0629', '\u0627\u0644\u0627\u0646\u0634\u0637\u0629', '\u0623\u0646\u0634\u0637\u0629', '\u0627\u0646\u0634\u0637\u0629']
    },
    {
        key: 'products',
        labelEn: 'Products',
        labelAr: '\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a',
        aliases: ['products', 'product', '\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a', '\u0645\u0646\u062a\u062c\u0627\u062a']
    }
];

const isAliasMatch = (normalizedName, normalizedAlias) =>
    normalizedName === normalizedAlias ||
    normalizedName.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedName);

const getCategoryKeyByName = (name = '') => {
    const normalizedName = normalizeLookupValue(name);
    if (!normalizedName) return null;

    const matched = MAIN_CATEGORY_DEFINITIONS.find((category) =>
        category.aliases.some((alias) => isAliasMatch(normalizedName, normalizeLookupValue(alias)))
    );

    return matched?.key || null;
};

const buildMainCostCenterOptions = (centers = []) => {
    const grouped = MAIN_CATEGORY_DEFINITIONS.reduce((acc, category) => {
        acc[category.key] = [];
        return acc;
    }, {});

    centers.forEach((center) => {
        const categoryKey = getCategoryKeyByName(center.name);
        if (categoryKey) {
            grouped[categoryKey].push(center);
        }
    });

    const orderedKeys = MAIN_CATEGORY_DEFINITIONS.map((category) => category.key);
    const options = orderedKeys
        .map((key) => grouped[key][0])
        .filter(Boolean)
        .map((center) => ({
            _id: center._id,
            name: center.name,
            type: center.type,
            category: getCategoryKeyByName(center.name)
        }));

    const categorized = MAIN_CATEGORY_DEFINITIONS.map((category) => ({
        key: category.key,
        labelEn: category.labelEn,
        labelAr: category.labelAr,
        options: grouped[category.key] || []
    }));

    return { grouped, options, categorized };
};

const getListQuery = (companyFilter, query) => {
    const dbQuery = { ...companyFilter };
    if (query.activeOnly === true || query.activeOnly === 'true') {
        dbQuery.isActive = true;
    }
    if (query.branchId && query.branchId !== 'all' && query.branchId !== '') {
        dbQuery.branchId = query.branchId;
    }
    return dbQuery;
};

const validateHierarchy = async ({ companyId, type, parentId, currentId = null }) => {
    if (type === 'main') {
        if (parentId) {
            throw new AppError('Main cost center cannot have a parent', 400);
        }
        return;
    }

    if (!parentId) {
        throw new AppError('Parent is required when type is sub', 400);
    }

    if (currentId && String(parentId) === String(currentId)) {
        throw new AppError('Cost center cannot be parent of itself', 400);
    }

    const parent = await costCenterModel.findOne({ _id: parentId, companyId });
    if (!parent) {
        throw new AppError('Parent cost center not found', 404);
    }
    if (parent.type !== 'main') {
        throw new AppError('Parent must be a main cost center', 400);
    }
    if (!getCategoryKeyByName(parent.name)) {
        throw new AppError('Parent must be one of: Projects, Departments, Activities, Products', 400);
    }
};

export const getAllCostCenters = catchAsyncError(async (req, res) => {
    const query = getListQuery(req.companyFilter, req.query);
    const centers = await costCenterModel
        .find(query)
        .populate('parentId', 'name type')
        .sort({ createdAt: -1 });

    const parentCandidates = await costCenterModel
        .find({ ...req.companyFilter, type: 'main' })
        .select('_id name type')
        .sort({ createdAt: -1 });

    const mainCostCenterOptions = buildMainCostCenterOptions(parentCandidates);

    res.status(200).json({
        message: 'Cost centers retrieved successfully',
        costCenters: centers,
        mainCostCenterOptions
    });
});

export const createCostCenter = catchAsyncError(async (req, res, next) => {
    const companyId = req.user.companyId;
    if (!companyId) return next(new AppError('Cost center creation requires a company context', 403));

    const payload = {
        name: String(req.body.name || '').trim(),
        type: req.body.type,
        parentId: normalizeOptionalId(req.body.parentId),
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        branchId: normalizeOptionalId(req.body.branchId),
        companyId
    };

    await validateHierarchy({ companyId, type: payload.type, parentId: payload.parentId });

    const created = await costCenterModel.create(payload);
    const populated = await costCenterModel.findById(created._id).populate('parentId', 'name type');

    res.status(201).json({
        message: 'Cost center created successfully',
        costCenter: populated || created
    });
});

export const updateCostCenter = catchAsyncError(async (req, res) => {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const existing = await costCenterModel.findOne({ _id: id, companyId });
    if (!existing) {
        throw new AppError('Cost center not found', 404);
    }

    const nextType = req.body.type ?? existing.type;
    const nextParentId = req.body.hasOwnProperty('parentId')
        ? normalizeOptionalId(req.body.parentId)
        : existing.parentId;

    await validateHierarchy({
        companyId,
        type: nextType,
        parentId: nextParentId,
        currentId: existing._id
    });

    const updateData = {};
    if (req.body.name !== undefined) updateData.name = String(req.body.name).trim();
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.hasOwnProperty('parentId')) updateData.parentId = nextParentId;
    if (req.body.isActive !== undefined) updateData.isActive = Boolean(req.body.isActive);
    if (req.body.hasOwnProperty('branchId')) updateData.branchId = normalizeOptionalId(req.body.branchId);

    const updated = await costCenterModel
        .findOneAndUpdate({ _id: id, companyId }, updateData, { new: true })
        .populate('parentId', 'name type');

    res.status(200).json({
        message: 'Cost center updated successfully',
        costCenter: updated
    });
});

export const deleteCostCenter = catchAsyncError(async (req, res) => {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const center = await costCenterModel.findOne({ _id: id, companyId });
    if (!center) {
        throw new AppError('Cost center not found', 404);
    }

    const childrenCount = await costCenterModel.countDocuments({ companyId, parentId: id });
    if (childrenCount > 0) {
        throw new AppError('Cannot delete main cost center while it has sub cost centers', 400);
    }

    await costCenterModel.findOneAndDelete({ _id: id, companyId });

    res.status(200).json({
        message: 'Cost center deleted successfully',
        costCenter: center
    });
});
