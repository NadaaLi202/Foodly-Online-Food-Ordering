const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../../frontend/src/Pages/Finance/Expenses.jsx');
let content = fs.readFileSync(file, 'utf8');

const targetStr = `<input
                                            type="text"
                                            name="account"
                                            value={formData.account}
                                            onChange={handleInputChange}
                                            placeholder={i18n.language === 'ar' ? 'اختياري' : 'Optional'}
                                            className={\`w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium\`}
                                        />`;

const replacementStr = `<select
                                            name="account"
                                            value={formData.account}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium bg-white"
                                        >
                                            <option value="">{i18n.language === 'ar' ? 'اختر حساب...' : 'Select Account...'}</option>
                                            {PREDEFINED_ACCOUNTS_GROUPS.map((group, idx) => (
                                                <optgroup key={idx} label={group.label}>
                                                    {group.accounts.map(acc => (
                                                        <option key={acc.code} value={\`\${acc.name} #\${acc.code}\`}>
                                                            {acc.name} #{acc.code}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(file, content);
console.log('patched');
