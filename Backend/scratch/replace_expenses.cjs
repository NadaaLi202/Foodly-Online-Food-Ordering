const fs = require('fs');
const file = 'c:/Users/khedr/Documents/Dafater-accounting/frontend/src/Pages/Finance/Expenses.jsx';
let content = fs.readFileSync(file, 'utf8');

const t0 = `    useEffect(() => {
        fetchExpenses();
    }, []);`;
const alt_t0 = `    useEffect(() => {\r\n        fetchExpenses();\r\n    }, []);`;

const r0 = `    const fetchChartOfAccounts = async () => {
        try {
            const response = await api.get('/chart-of-accounts');
            setChartOfAccounts((response.data.accounts || []).filter(a => a.type === 'sub'));
        } catch (error) {
            logError('Error fetching chart of accounts:', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
        fetchChartOfAccounts();
    }, []);`;

content = content.replace(t0, r0).replace(alt_t0, r0);

const targetRegex = /\{\/\*\s*Account\s*\*\/\}\s*<div\b[^>]*>\s*<label\b[^>]*>[\s\S]*?<\/label>\s*<input[^>]*name="account"[^>]*\/>\s*<\/div>/g;

const r2 = `                                    {/* Account (Grouped Searchable Dropdown) */}
                                    <div className="relative">
                                        <label className={\`block text-sm font-bold text-gray-700 mb-1.5\`}>
                                            {i18n.language === 'ar' ? 'الحساب' : 'Account'}
                                        </label>
                                        <div
                                            onClick={() => {
                                                if (modalMode !== 'view') {
                                                    setIsAccountDropdownOpen(!isAccountDropdownOpen);
                                                    setAccountSearchTerm('');
                                                }
                                            }}
                                            className={\`w-full border border-gray-300 rounded-lg px-3 py-2.5 flex items-center justify-between transition-all bg-white cursor-pointer hover:border-indigo-400 \${modalMode === 'view' ? 'bg-gray-50 opacity-75' : ''}\`}
                                        >
                                            <ChevronDown size={18} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-800 truncate w-full text-right">
                                                {formData.account || (i18n.language === 'ar' ? 'اختر حساب' : 'Select Account')}
                                            </span>
                                        </div>
                                        {isAccountDropdownOpen && (
                                            <div className="absolute bottom-full mb-1 z-50 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                                                    <input
                                                        type="text"
                                                        value={accountSearchTerm}
                                                        autoFocus
                                                        onChange={(e) => setAccountSearchTerm(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        placeholder={i18n.language === 'ar' ? 'ابحث عن حساب...' : 'Search accounts...'}
                                                        className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-right"
                                                        dir="rtl"
                                                    />
                                                </div>
                                                <div className="overflow-y-auto py-1">
                                                    {['asset', 'liability', 'equity', 'income', 'expense'].map(cat => {
                                                        const filtered = chartOfAccounts.filter(a =>
                                                            a.category === cat &&
                                                            (a.name.toLowerCase().includes(accountSearchTerm.toLowerCase()) ||
                                                                a.code.includes(accountSearchTerm))
                                                        );

                                                        if (filtered.length === 0) return null;

                                                        const catLabels = {
                                                            asset: i18n.language === 'ar' ? 'أصول / Assets' : 'Assets',
                                                            liability: i18n.language === 'ar' ? 'التزامات / Liabilities' : 'Liabilities',
                                                            equity: i18n.language === 'ar' ? 'حقوق الملكية / Equity' : 'Equity',
                                                            income: i18n.language === 'ar' ? 'إيرادات / Income' : 'Income',
                                                            expense: i18n.language === 'ar' ? 'مصروفات / Expenses' : 'Expenses'
                                                        };

                                                        return (
                                                            <div key={cat}>
                                                                <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                                                                    {catLabels[cat]}
                                                                </div>
                                                                {filtered.map(acc => (
                                                                    <div
                                                                        key={acc._id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, account: \`\${acc.name} #\${acc.code}\` }));
                                                                            setIsAccountDropdownOpen(false);
                                                                        }}
                                                                        className={\`px-6 py-2.5 hover:bg-indigo-50 cursor-pointer flex flex-col items-end \${formData.account === \`\${acc.name} #\${acc.code}\` ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-gray-700'}\`}
                                                                    >
                                                                        <span className="text-sm font-bold w-full text-right">{acc.name} <span className="text-[10px] opacity-60 font-medium">#{acc.code}</span></span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>`;

content = content.replace(targetRegex, r2);

fs.writeFileSync(file, content);
console.log("Replaced successfully!");
