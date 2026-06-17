/**
 * Met à jour les codes postaux des concessions dans la DB à partir d'un mapping ville → CP
 */
const path = require('path')
const fs = require('fs')
const DB_PATH = 'C:\\Users\\levav\\AppData\\Roaming\\asb-crm\\crm.db'

const cityToCP = {
  'Paris': '75001', 'Paris 8e': '75008', 'Paris 9e': '75009', 'Paris 11e': '75011',
  'Paris 12e': '75012', 'Paris 13e': '75013', 'Paris 15e': '75015', 'Paris 16e': '75016',
  'Paris 17e': '75017', 'Paris 20e': '75020', 'La Défense': '92400',
  'Neuilly-sur-Seine': '92200', 'Levallois-Perret': '92300', 'Versailles': '78000',
  'Lyon': '69001', 'Marseille': '13001', 'Toulouse': '31000', 'Nice': '06000',
  'Nantes': '44000', 'Bordeaux': '33000', 'Lille': '59000', 'Strasbourg': '67000',
  'Rennes': '35000', 'Grenoble': '38000', 'Montpellier': '34000', 'Dijon': '21000',
  'Annecy': '74000', 'Toulon': '83000', 'Metz': '57000', 'Clermont-Ferrand': '63000',
  'Rouen': '76000', 'Mulhouse': '68100', 'Bourg-en-Bresse': '01000', 'Vichy': '03200',
  'Montargis': '45200', 'Amiens': '80000', 'Brest': '29200', 'Chambéry': '73000',
  'Beaune': '21200', 'Annemasse': '74100', 'Auxerre': '89000', 'Sassenage': '38360',
  'Perpignan': '66000', 'La Roche-sur-Yon': '85000', 'Compiègne': '60200',
  'Caen': '14000', 'Gien': '45500', 'Orléans': '45000',
  'Genève': '1200',
}

async function main() {
  const initSqlJs = require(path.join(__dirname, '..', 'node_modules', 'sql.js'))
  const SQL = await initSqlJs({ locateFile: () => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm') })
  const db = new SQL.Database(fs.readFileSync(DB_PATH))

  let updated = 0
  for (const [ville, cp] of Object.entries(cityToCP)) {
    const r = db.exec(`UPDATE ContactPro SET codePostal=? WHERE ville=? AND (codePostal IS NULL OR codePostal='')`, [cp, ville])
    if (r) updated++
  }

  // Vérification
  const stmt = db.prepare('SELECT COUNT(*) as c FROM ContactPro WHERE codePostal IS NOT NULL AND codePostal != ""')
  stmt.step()
  const count = stmt.getAsObject().c
  stmt.free()

  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
  console.log(`✓ Codes postaux mis à jour. ${count} concessions ont maintenant un CP.`)
}

main().catch(e => { console.error(e); process.exit(1) })
