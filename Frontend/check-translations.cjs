const en = require('./src/locales/en.json');
const ar = require('./src/locales/ar.json');

const keys = [
  'reports.error_load',
  'reports.accounting.cost_centers',
  'reports.filters.from_date',
  'reports.filters.to_date',
  'reports.restriction_number',
  'reports.account',
  'reports.date',
  'reports.source',
  'reports.description',
  'reports.percentage',
  'reports.debit',
  'reports.credit',
  'reports.balance',
  'reports.total',
  'reports.export.success',
  'reports.export.error',
  'reports.filters.current_month',
  'reports.filters.last_month',
  'reports.filters.current_quarter',
  'reports.filters.current_year',
  'reports.filters.period',
  'reports.filters.branch',
  'reports.filters.all_branches',
  'reports.filters.all_cost_centers',
  'reports.filters.show_reports',
  'reports.export.excel',
  'reports.export.pdf',
  'reports.export.print',
  'reports.no_data'
];

const getByPath = (obj, path) => {
  return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
};

let missing = [];
keys.forEach(key => {
  const enVal = getByPath(en, key);
  const arVal = getByPath(ar, key);
  if (!enVal || !arVal) {
    missing.push({key, en: !!enVal, ar: !!arVal});
  }
});

if (missing.length === 0) {
  console.log('SUCCESS: All 29 translation keys are present in both languages!');
  keys.forEach(key => {
    const enVal = getByPath(en, key);
    const arVal = getByPath(ar, key);
    console.log(`  ✓ ${key}`);
  });
} else {
  console.log('MISSING KEYS:');
  missing.forEach(m => {
    console.log(`  ✗ ${m.key} (EN: ${m.en ? 'OK' : 'MISSING'}, AR: ${m.ar ? 'OK' : 'MISSING'})`);
  });
  process.exit(1);
}
