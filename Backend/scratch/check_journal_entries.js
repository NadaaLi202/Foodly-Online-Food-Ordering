import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const dailyRestrictionSchema = new mongoose.Schema({}, { strict: false });
const DailyRestriction = mongoose.model('DailyRestriction', dailyRestrictionSchema, 'dailyrestrictions');

async function checkCollection() {
  try {
    await mongoose.connect(process.env.DB_CONNECTION);
    console.log('Connected to MongoDB');

    const companyId = "69da1850d707a07e54b9a819";
    const entries = await DailyRestriction.find({ companyId: new mongoose.Types.ObjectId(companyId) }).limit(5).lean();
    const count = await DailyRestriction.countDocuments({ companyId: new mongoose.Types.ObjectId(companyId) });

    console.log(`[VERIFY] DailyRestriction count for company ${companyId}: ${count}`);
    console.log(`[VERIFY] Sample entries:`, JSON.stringify(entries, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkCollection();
