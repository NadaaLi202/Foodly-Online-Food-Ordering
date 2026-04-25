import mongoose from 'mongoose';
import { costCenterModel } from './src/modules/costCenters/costCenter.model.js';

mongoose.connect('mongodb://localhost:27017/dafater').then(async () => {
    console.log('Connected to DB');
    const defaultNames = ['Projects', 'Departments', 'Activities', 'Products'];
    for (const name of defaultNames) {
        const centers = await costCenterModel.find({ name }).sort({ createdAt: 1 });
        if (centers.length > 1) {
            const keep = centers[0];
            const remove = centers.slice(1).map(c => c._id);
            await costCenterModel.deleteMany({ _id: { $in: remove } });
            console.log('Removed duplicates for', name);
        } else {
            console.log('No duplicates for', name);
        }
    }

    // Also remove any cost centers with exact same name in same companyId
    const allCenters = await costCenterModel.find({});
    const grouped = {};
    for (const c of allCenters) {
        const key = `${c.companyId}_${c.name}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(c);
    }
    for (const key in grouped) {
        if (grouped[key].length > 1) {
            const sorted = grouped[key].sort((a, b) => a.createdAt - b.createdAt);
            const remove = sorted.slice(1).map(c => c._id);
            await costCenterModel.deleteMany({ _id: { $in: remove } });
            console.log('Removed duplicates for key', key);
        }
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
