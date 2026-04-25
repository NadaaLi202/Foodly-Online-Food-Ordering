import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, FileText, UserPlus, Package, ShoppingCart, Truck, CreditCard, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions';
import { addMenuConfig } from '../../config/addMenuConfig';

const iconMap = {
    FileText,
    UserPlus,
    Package,
    ShoppingCart,
    Truck,
    CreditCard
};

const AddMenu = ({ isRtl }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Filter items based on permissions
    const allowedItems = addMenuConfig.filter((item) =>
        hasPermission(item.permission.module, item.permission.action)
    );

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const resolveItemTarget = (item) => {
        const isDashboardContext = location.pathname.startsWith('/dashboard');
        const preferredPath = isDashboardContext ? (item.fallbackPath || item.route) : (item.route || item.fallbackPath);

        if (!preferredPath) {
            // TODO: page not built yet
            return null;
        }

        return {
            path: preferredPath,
            state: item.state
        };
    };

    const handleItemClick = (item) => {
        setIsOpen(false);

        const target = resolveItemTarget(item);
        if (!target) {
            // TODO: page not built yet
            toast.error('هذه الصفحة قيد التطوير');
            return;
        }

        navigate(target.path, { state: target.state });
    };

    if (allowedItems.length === 0) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1 text-green-600 font-bold hover:bg-green-50 px-2 py-1 rounded-md transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
            >
                <Plus size={18} />
                <span>{t('topbar.add')}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className={`absolute top-10 ${isRtl ? 'right-0' : 'left-0'} min-w-[180px] bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200`}
                >
                    {allowedItems.map((item, index) => {
                        const IconComponent = iconMap[item.icon] || FileText;
                        return (
                            <button
                                key={item.key || index}
                                onClick={() => handleItemClick(item)}
                                className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                            >
                                <IconComponent size={16} className="text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AddMenu;
