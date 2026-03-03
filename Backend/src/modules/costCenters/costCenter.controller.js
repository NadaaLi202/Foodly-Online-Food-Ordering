import { AppError } from "../../utils/AppError.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import { costCenterModel } from "./costCenter.model.js";

const normalizeOptionalId = (value) => {
    if (value === undefined || value === null || value === '') return null;
    return value;
};

const DEFAULT_SYSTEM_COST_CENTERS = ['Projects', 'Departments', 'Activities', 'Products'];
const normalizeName = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, ' ');

const getCompanyIdFromRequest = (req) =>
    req?.companyFilter?.companyId || req?.user?.companyId || null;

const normalizeParentIdFromBody = (body = {}) => (
    normalizeOptionalId(body.parentId ?? body.parent_id)
);

const ensureDefaultSystemCostCenters = async (companyId) => {
    if (!companyId) return;

    const existingMainCenters = await costCenterModel
        .find({ companyId, type: 'main' })
        .select('_id name isSystem parentId');

    const byNormalizedName = new Map();
    existingMainCenters.forEach((center) => {
        byNormalizedName.set(normalizeName(center.name), center);
    });

    const updates = [];
    const inserts = [];

    DEFAULT_SYSTEM_COST_CENTERS.forEach((name) => {
        const existing = byNormalizedName.get(normalizeName(name));
        if (!existing) {
            inserts.push({
                name,
                type: 'main',
                parentId: null,
                isSystem: true,
                isActive: true,
                companyId
            });
            return;
        }

        if (!existing.isSystem || existing.parentId) {
            updates.push({
                updateOne: {
                    filter: { _id: existing._id },
                    update: { $set: { isSystem: true, type: 'main', parentId: null } }
                }
            });
        }
    });

    if (updates.length) await costCenterModel.bulkWrite(updates);
    if (inserts.length) await costCenterModel.insertMany(inserts, { ordered: false });
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
    if (!parentId) {
        if (type === 'sub') {
            throw new AppError('Parent is required when type is sub', 400);
        }
        return;
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

    if (!currentId) return;

    let walker = parent;
    const visited = new Set();

    while (walker?.parentId) {
        const walkerId = String(walker._id);
        if (visited.has(walkerId)) {
            throw new AppError('Circular hierarchy detected', 400);
        }
        visited.add(walkerId);

        if (String(walker.parentId) === String(currentId)) {
            throw new AppError('Circular hierarchy is not allowed', 400);
        }

        // eslint-disable-next-line no-await-in-loop
        walker = await costCenterModel.findOne({ _id: walker.parentId, companyId }).select('_id parentId');
    }
};

export const getAllCostCenters = catchAsyncError(async (req, res) => {
    const companyId = getCompanyIdFromRequest(req);
    await ensureDefaultSystemCostCenters(companyId);

    const query = getListQuery(req.companyFilter, req.query);
    const centers = await costCenterModel
        .find(query)
        .populate('parentId', 'name type')
        .sort({ isSystem: -1, createdAt: -1 });

    res.status(200).json({
        message: 'Cost centers retrieved successfully',
        costCenters: centers
    });
});

export const getParentCostCenters = catchAsyncError(async (req, res) => {
    const companyId = getCompanyIdFromRequest(req);
    await ensureDefaultSystemCostCenters(companyId);

    const parents = await costCenterModel
        .find({ ...req.companyFilter, type: 'main' })
        .select('_id name')
        .sort({ isSystem: -1, createdAt: -1 });

    res.status(200).json({
        message: 'Parent cost centers retrieved successfully',
        costCenters: parents.map((center) => ({
            id: center._id,
            name: center.name
        }))
    });
});

export const createCostCenter = catchAsyncError(async (req, res, next) => {
    const companyId = req.user.companyId;
    if (!companyId) return next(new AppError('Cost center creation requires a company context', 403));

    const payload = {
        name: String(req.body.name || '').trim(),
        type: req.body.type,
        parentId: normalizeParentIdFromBody(req.body),
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

    if (existing.isSystem && req.body.type && req.body.type !== 'main') {
        throw new AppError('System cost center must remain main', 400);
    }

    const nextType = req.body.type ?? existing.type;
    const hasParentField = Object.prototype.hasOwnProperty.call(req.body, 'parentId')
        || Object.prototype.hasOwnProperty.call(req.body, 'parent_id');
    const nextParentId = hasParentField
        ? normalizeParentIdFromBody(req.body)
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
    if (hasParentField) updateData.parentId = nextParentId;
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
    if (center.isSystem) {
        throw new AppError('System cost centers cannot be deleted', 403);
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
