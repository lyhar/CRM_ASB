/**
 * Script one-shot : extrait les concessions depuis import.js → context/seeds/concessions.json
 */
const fs = require('fs')
const path = require('path')

const importSrc = fs.readFileSync(path.join(__dirname, 'import.js'), 'utf-8')

// Eval the two arrays
const concessionsExcel = []
const concessionsNationales = []

// Extract concessionsExcel block
const matchExcel = importSrc.match(/const concessionsExcel = \[([\s\S]*?)\]\s*\n\s*let concExcelCount/)
if (matchExcel) {
  const fn = new Function('return [' + matchExcel[1] + ']')
  concessionsExcel.push(...fn())
}

// Extract concessionsNationales block
const matchNat = importSrc.match(/const concessionsNationales = \[([\s\S]*?)\]\s*\n\s*let concNatCount/)
if (matchNat) {
  const fn = new Function('return [' + matchNat[1] + ']')
  concessionsNationales.push(...fn())
}

const all = [
  ...concessionsExcel.map(c => ({
    entreprise: c.entreprise,
    ville: c.ville || '',
    telephone: c.telephone || '',
    email: c.email || '',
    notes: c.notes || ''
  })),
  ...concessionsNationales.map(c => ({
    entreprise: c.entreprise,
    ville: c.ville || '',
    telephone: '',
    email: '',
    notes: c.notes || ''
  }))
]

const outDir = path.join(__dirname, '..', 'context', 'seeds')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'concessions.json')
fs.writeFileSync(outPath, JSON.stringify(all, null, 2), 'utf-8')
console.log(`✓ ${all.length} concessions écrites dans ${outPath}`)
