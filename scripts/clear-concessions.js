const path = require('path')
const fs = require('fs')
const initSqlJs = require(path.join(__dirname, '..', 'node_modules', 'sql.js'))
const DB_PATH = fs.existsSync('C:\\Users\\levav\\AppData\\Roaming\\autolead-crm\\crm.db')
  ? 'C:\\Users\\levav\\AppData\\Roaming\\autolead-crm\\crm.db'
  : 'C:\\Users\\levav\\AppData\\Roaming\\asb-crm\\crm.db'

initSqlJs({ locateFile: () => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm') }).then(SQL => {
  const db = new SQL.Database(fs.readFileSync(DB_PATH))
  const before = db.exec('SELECT COUNT(*) FROM ContactPro')[0].values[0][0]
  db.exec('DELETE FROM ContactPro')
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
  console.log(`✓ ${before} concessions supprimées. Table ContactPro vidée.`)
})
