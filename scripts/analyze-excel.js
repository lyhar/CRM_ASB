const path = require('path')
const XLSX = require(path.join(__dirname, '..', 'node_modules', 'xlsx'))

const filePath = process.argv[2]
if (!filePath) { console.error('Usage: node analyze-excel.js <chemin_du_fichier.xlsx>'); process.exit(1) }

const wb = XLSX.readFile(filePath)
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

console.log('\n=== EN-TÊTES (ligne 1) ===')
const headers = rows[0] || []
headers.forEach((h, i) => console.log(`  col[${i}] = "${h}"`))

console.log('\n=== DONNÉES (lignes 2 à 4) ===')
for (let i = 1; i <= Math.min(3, rows.length - 1); i++) {
  console.log(`\n--- Ligne ${i + 1} ---`)
  rows[i].forEach((v, j) => {
    if (v !== undefined && v !== null && v !== '') {
      console.log(`  col[${j}] "${headers[j] || '?'}" = ${JSON.stringify(v)}`)
    }
  })
}
