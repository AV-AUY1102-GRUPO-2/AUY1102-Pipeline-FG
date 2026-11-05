/**
 * Informe de pruebas unitarias y cobertura.
 *
 * Ejecuta Jest con cobertura y luego muestra un resumen con:
 *   1. El porcentaje de cobertura total y por archivo.
 *   2. Las pruebas que fallan, con su mensaje de error.
 *   3. Las líneas de código que ninguna prueba ejecutó.
 *
 * Uso:  npm run test:report
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'coverage');
const RESULTS = path.join(OUT, 'test-results.json');
const SUMMARY = path.join(OUT, 'coverage-summary.json');
const DETAIL = path.join(OUT, 'coverage-final.json');

const line = (char = '─') => console.log(char.repeat(70));
const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');
const pct = (value) => `${value.toFixed(2).padStart(6)} %`;
const icon = (value) => (value >= 80 ? '🟢' : value >= 50 ? '🟡' : '🔴');

// Agrupa números de línea consecutivos en rangos: [3,4,5,9] -> "3-5, 9"
const toRanges = (numbers) => {
  const ranges = [];
  for (const n of numbers) {
    const last = ranges.at(-1);
    if (last && n === last[1] + 1) last[1] = n;
    else ranges.push([n, n]);
  }
  return ranges.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(', ');
};

// ── 1. Ejecutar Jest ───────────────────────────────────────────────────
fs.mkdirSync(OUT, { recursive: true });
console.log('\n▶ Ejecutando pruebas unitarias con cobertura...\n');

const jest = spawnSync(
  'npx',
  [
    'jest',
    '--coverage',
    '--json',
    `--outputFile=${RESULTS}`,
    '--coverageReporters=json-summary',
    '--coverageReporters=json',
    '--coverageReporters=lcov',
  ],
  { cwd: ROOT, shell: true, encoding: 'utf8' }
);

if (!fs.existsSync(RESULTS) || !fs.existsSync(SUMMARY)) {
  console.error('❌ Jest no generó resultados. Salida original:\n');
  console.error(jest.stdout, jest.stderr);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
const summary = JSON.parse(fs.readFileSync(SUMMARY, 'utf8'));
const detail = JSON.parse(fs.readFileSync(DETAIL, 'utf8'));

// ── 2. Resumen de pruebas ──────────────────────────────────────────────
line('═');
console.log('  INFORME DE PRUEBAS UNITARIAS Y COBERTURA');
line('═');
console.log(
  `\n  Archivos de prueba: ${results.numTotalTestSuites}` +
    `  (✅ ${results.numPassedTestSuites} ok · ❌ ${results.numFailedTestSuites} con fallas)`
);
console.log(
  `  Pruebas:            ${results.numTotalTests}` +
    `  (✅ ${results.numPassedTests} ok · ❌ ${results.numFailedTests} fallidas)\n`
);

// ── 3. Pruebas que fallan ──────────────────────────────────────────────
line();
console.log('  ❌ PRUEBAS QUE FALLAN');
line();
const failed = [];
for (const suite of results.testResults) {
  const asserts = suite.assertionResults.filter((a) => a.status === 'failed');
  for (const a of asserts)
    failed.push({
      file: rel(suite.name),
      name: a.fullName,
      msg: a.failureMessages[0] || '',
    });
  // Archivos que ni siquiera pudieron cargarse (por ejemplo, un import roto)
  if (asserts.length === 0 && suite.status === 'failed') {
    failed.push({
      file: rel(suite.name),
      name: '(el archivo no pudo ejecutarse)',
      msg: suite.message || '',
    });
  }
}
if (failed.length === 0) {
  console.log('  Ninguna. Todas las pruebas pasaron. ✅');
} else {
  for (const f of failed) {
    const clean = f.msg
      .replace(/\u001b\[[0-9;]*m/g, '')
      .split('\n')
      .map((l) => l.trim());
    const useful = clean.filter((l) =>
      /^(Expected|Received|Cannot find module|SyntaxError|TypeError)/.test(l)
    );
    const reason =
      useful.length > 0
        ? useful
        : [clean.find((l) => l && !l.startsWith('●')) || ''];
    console.log(`  • ${f.file}`);
    console.log(`      Prueba: ${f.name}`);
    for (const r of reason.slice(0, 2)) console.log(`      ${r}`);
  }
}

// ── 4. Cobertura ───────────────────────────────────────────────────────
console.log('');
line();
console.log('  📊 COBERTURA DE CÓDIGO');
line();
const t = summary.total;
console.log(
  `  ${icon(t.lines.pct)} Líneas:        ${pct(t.lines.pct)}  (${
    t.lines.covered
  }/${t.lines.total})`
);
console.log(
  `  ${icon(t.statements.pct)} Instrucciones: ${pct(t.statements.pct)}  (${
    t.statements.covered
  }/${t.statements.total})`
);
console.log(
  `  ${icon(t.functions.pct)} Funciones:     ${pct(t.functions.pct)}  (${
    t.functions.covered
  }/${t.functions.total})`
);
console.log(
  `  ${icon(t.branches.pct)} Ramas (if):    ${pct(t.branches.pct)}  (${
    t.branches.covered
  }/${t.branches.total})`
);

console.log('\n  Por archivo (% de líneas):');
const files = Object.keys(summary)
  .filter((k) => k !== 'total')
  .sort();
for (const file of files) {
  const p = summary[file].lines.pct;
  console.log(`   ${icon(p)} ${pct(p)}  ${rel(file)}`);
}

// ── 5. Código sin cubrir ───────────────────────────────────────────────
console.log('');
line();
console.log('  🔍 CÓDIGO NO CUBIERTO POR PRUEBAS');
line();
let uncoveredFiles = 0;
for (const file of Object.keys(detail).sort()) {
  const { statementMap, s } = detail[file];
  const lines = new Set();
  for (const id of Object.keys(s)) {
    if (s[id] === 0) {
      const { start, end } = statementMap[id];
      for (let n = start.line; n <= end.line; n += 1) lines.add(n);
    }
  }
  if (lines.size > 0) {
    uncoveredFiles += 1;
    console.log(`  • ${rel(file)}`);
    console.log(
      `      Líneas sin cubrir: ${toRanges([...lines].sort((a, b) => a - b))}`
    );
  }
}
if (uncoveredFiles === 0) console.log('  Todo el código está cubierto. ✅');

console.log('');
line('═');
console.log('  Informe visual: coverage/lcov-report/index.html');
line('═');
console.log('');

process.exit(results.success ? 0 : 1);
