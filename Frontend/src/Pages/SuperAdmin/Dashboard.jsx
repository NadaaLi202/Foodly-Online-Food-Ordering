import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import companyService from '../../services/companyservice';
import logError from '../../utils/logerror';
import { Plus, Building, Users, LogIn } from 'lucide-react';

const SuperAdminDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ companies: 0, users: 0 }); // Placeholder for stats

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const companies = await companyService.getAllCompanies();
            // Assuming stats might come from a different endpoint or we calculate from list
            setStats({ companies: companies.length || 0, users: 0 });
        } catch (error) {
            logError('Error fetching stats:', error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">{t('superAdmin.dashboard')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full mr-4">
                        <Building className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">{t('superAdmin.totalCompanies')}</p>
                        <p className="text-2xl font-bold">{stats.companies}</p>
                    </div>
                </div>
                {/* Add more stats cards as needed */}
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">{t('superAdmin.quickActions')}</h2>
                </div>
                <div className="p-6 flex flex-wrap gap-4">
                    <button
                        onClick={() => navigate('/super-admin/companies')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        <Building size={18} className="mr-2" />
                        {t('superAdmin.manageCompanies')}
                    </button>
                    {/* Add more action buttons */}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
