const path = require('path')
const fs = require('fs')
const initSqlJs = require(path.join(__dirname, '..', 'node_modules', 'sql.js'))
initSqlJs({ locateFile: () => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm') }).then(SQL => {
  const db = new SQL.Database(fs.readFileSync('C:\\Users\\levav\\AppData\\Roaming\\asb-crm\\crm.db'))
  const total = db.exec('SELECT COUNT(*) FROM ContactPro')
  const withCP = db.exec("SELECT COUNT(*) FROM ContactPro WHERE codePostal IS NOT NULL AND codePostal != ''")
  const missing = db.exec("SELECT DISTINCT ville, codePostal FROM ContactPro WHERE codePostal IS NULL OR codePostal = ''")
  console.log(`Total: ${total[0].values[0][0]}, avec CP: ${withCP[0].values[0][0]}`)
  if (missing[0]) {
    console.log('Manquants:')
    missing[0].values.forEach(r => console.log(' -', r[0], r[1]))
  } else {
    console.log('Toutes les concessions ont un CP !')
  }
})
