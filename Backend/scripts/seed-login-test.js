/**
 * Verify DB connection and optionally seed a test company for login.
 * Run from Backend: node scripts/seed-login-test.js [email] [password]
 * Default: zahwaahmed@gmail.com / Test1234
 *
 * - Connects using DB_CONNECTION from .env
 * - Checks if a user or company exists with the given email (normalized to lowercase)
 * - If none exists, creates a Company with that email, hashed password, status 'active'
 * - Password is hashed via the Company model's pre-save hook (bcrypt)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { companyModel } from '../src/modules/companies/company.model.js';
import { userModel } from '../src/modules/user/user.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const TEST_EMAIL = (process.argv[2] || 'zahwaahmed@gmail.com').trim().toLowerCase();
const TEST_PASSWORD = process.argv[3] || 'Test1234';

async function main() {
    const uri = process.env.DB_CONNECTION;
    if (!uri) {
        console.error('Missing DB_CONNECTION in .env');
        process.exit(1);
    }

    // Avoid logging full URI (contains credentials)
    const dbName = uri.replace(/\?.*$/, '').split('/').pop() || 'unknown';
    console.log('Using database:', dbName);

    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB\n');
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }

    try {
        const user = await userModel.findOne({ email: TEST_EMAIL }).lean();
        const company = await companyModel.findOne({ email: TEST_EMAIL }).lean();

        if (user) {
            console.log('User found with email:', TEST_EMAIL);
            console.log('  _id:', user._id);
            console.log('  name:', user.name);
            console.log('  role:', user.role);
            console.log('  password stored (bcrypt):', String(user.password || '').startsWith('$2'));
        } else {
            console.log('No user found with email:', TEST_EMAIL);
        }

        if (company) {
            console.log('Company found with email:', TEST_EMAIL);
            console.log('  _id:', company._id);
            console.log('  name:', company.name);
            console.log('  status:', company.status);
            console.log('  password stored (bcrypt):', String(company.password || '').startsWith('$2'));
        } else {
            console.log('No company found with email:', TEST_EMAIL);
        }

        if (!user && !company) {
            console.log('\nCreating test company with email:', TEST_EMAIL, 'and password:', TEST_PASSWORD);
            const newCompany = new companyModel({
                name: 'Test Company Login',
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                status: 'active',
                phone: '',
            });
            await newCompany.save();
            console.log('Created company _id:', newCompany._id);
            console.log('You can now sign in with:', TEST_EMAIL, '/', TEST_PASSWORD);
        } else {
            console.log('\nAccount exists. If login still fails, check password and (for company) status === "active".');
        }
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected.');
        process.exit(0);
    }
}

main();
