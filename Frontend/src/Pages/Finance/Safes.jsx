import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Safes = () => {
    const { t } = useTranslation();

    return (
        <div className='py-6 px-4 sm:px-6 lg:px-8'>


            <div className='mx-auto max-w-7xl flex flex-col mt-5'>
                <div className="-my-2 -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-auto">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="table-classic min-w-full divide-y divide-gray-300">
                                <thead className="divide-y divide-gray-300 bg-gray-50">
                                    <tr>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3.5 ps-4 sm:ps-6 pe-3">
                                            {t('safes_page.name')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.branches')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.users')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.requisitions')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.custodians')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.balance')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 px-3 py-3.5">
                                            {t('safes_page.general_ledger')}
                                        </th>
                                        <th scope="col" className="whitespace-nowrap text-start text-sm font-semibold text-gray-900 py-3.5 ps-3 pe-4 sm:pe-6">
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    <tr>
                                        <td className="align-middle text-sm whitespace-nowrap text-start py-4 ps-4 pe-3 sm:ps-6 text-gray-900 font-medium">
                                            الخزنة الرئيسية
                                        </td>
                                        <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                            <div>{t('topbar.main_branch')}</div>
                                        </td>
                                        <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700"></td>
                                        <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="inline-block h-5 w-5 text-red-600 invisible">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"></path>
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="ms-2 inline-block h-5 w-5 text-green-600 invisible">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"></path>
                                            </svg>
                                        </td>
                                        <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700"></td>
                                        <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                            <button type="button" className="text-green-600 hover:text-green-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-slot="icon" className="w-5 h-5">
                                                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                                                    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd"></path>
                                                </svg>
                                            </button>
                                        </td>
                                        <td className="align-middle text-sm whitespace-nowrap px-3 py-4 text-gray-700">
                                            <Link to="/dashboard/reports/accounting/general-ledger?journal_account_id=65" className="text-purple-600 hover:text-purple-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-slot="icon" className="w-5 h-5">
                                                    <path d="M11.625 16.5a1.875 1.875 0 1 0 0-3.75 1.875 1.875 0 0 0 0 3.75Z"></path>
                                                    <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Zm6 16.5c.66 0 1.277-.19 1.797-.518l1.048 1.048a.75.75 0 0 0 1.06-1.06l-1.047-1.048A3.375 3.375 0 1 0 11.625 18Z" clipRule="evenodd"></path>
                                                    <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z"></path>
                                                </svg>
                                            </Link>
                                        </td>
                                        <td className="align-middle text-sm whitespace-nowrap text-end py-4 ps-3 pe-4 sm:pe-6 text-gray-700 relative font-medium">
                                            <span className="inline-block cursor-pointer text-indigo-600 hover:text-indigo-900">Edit</span>
                                            <span className="inline-block cursor-pointer text-red-600 hover:text-red-900 ms-2">Delete</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Safes;
