/**
 * Script de ré-import : supprime tous les Dossier+Client existants
 * et relance l'import Excel complet avec la correction des dates.
 *
 * Usage : node scripts/reimport.js
 *
 * Conserve : ContactPro (concessions), Marque, Modele, User
 */

const path = require('path')
const fs = require('fs')

const DB_PATH = 'C:\\Users\\levav\\AppData\\Roaming\\asb-crm\\crm.db'
const EXCEL_PATH = path.join(__dirname, '..', 'context', 'Fichier de suivi ASB (4).xlsx')

async function main() {
  const initSqlJs = require(path.join(__dirname, '..', 'node_modules', 'sql.js'))
  const SQL = await initSqlJs({
    locateFile: () => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  })

  const dbBuffer = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(dbBuffer)

  function run(sql, params = []) { db.run(sql, params) }
  function query(sql, params = []) {
    const stmt = db.prepare(sql); stmt.bind(params)
    const rows = []
    while (stmt.step()) {
      const row = {}, cols = stmt.getColumnNames(), vals = stmt.get()
      cols.forEach((c, i) => { row[c] = vals[i] }); rows.push(row)
    }
    stmt.free(); return rows
  }
  function queryOne(sql, params = []) { const r = query(sql, params); return r.length > 0 ? r[0] : null }
  function lastId() { return query('SELECT last_insert_rowid() as id')[0]?.id ?? 0 }
  function saveDb() { fs.writeFileSync(DB_PATH, Buffer.from(db.export())) }

  function parseDate(val) {
    if (!val) return null
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null
      const y = val.getUTCFullYear(), m = String(val.getUTCMonth()+1).padStart(2,'0'), d = String(val.getUTCDate()).padStart(2,'0')
      return `${y}-${m}-${d}T00:00:00.000Z`
    }
    if (typeof val === 'number') {
      const epoch = (val > 59 ? val - 1 : val) - 1
      const d = new Date(Date.UTC(1900, 0, 1) + epoch * 86400000)
      if (isNaN(d.getTime())) return null
      const y = d.getUTCFullYear(), mo = String(d.getUTCMonth()+1).padStart(2,'0'), dy = String(d.getUTCDate()).padStart(2,'0')
      return `${y}-${mo}-${dy}T00:00:00.000Z`
    }
    const s = String(val).trim()
    if (!s) return null
    const m1 = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
    if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}T00:00:00.000Z`
    const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}T00:00:00.000Z`
    return null
  }
  function parsePrice(str) {
    if (!str) return null
    const s = String(str).replace(/[^0-9.,]/g, '').replace(',', '.').trim()
    const v = parseFloat(s)
    return isNaN(v) || v === 0 ? null : v
  }
  function clean(str) { return str ? String(str).trim().replace(/\s+/g, ' ') : '' }
  function bool(str) {
    if (!str) return 0
    const s = String(str).trim().toUpperCase()
    return s.startsWith('O') ? 1 : 0
  }
  function generateNumero() {
    const year = new Date().getFullYear()
    const r = queryOne(`SELECT COUNT(*) as c FROM Dossier WHERE numeroDossier LIKE ?`, [`ASB-${year}-%`])
    const count = (r?.c ?? 0) + 1
    return `ASB-${year}-${String(count).padStart(4, '0')}`
  }

  // ─── 1. Nettoyage ────────────────────────────────────────────────────────
  console.log('\n▶ Suppression des données existantes (Dossiers, Clients)...')
  run('DELETE FROM Relance')
  run('DELETE FROM Document WHERE dossierId IS NOT NULL OR clientId IS NOT NULL')
  run('DELETE FROM Dossier')
  run('DELETE FROM Client')
  saveDb()
  console.log('  ✓ Tables Dossier et Client vidées')

  // ─── 2. Re-import Excel ──────────────────────────────────────────────────
  console.log('\n▶ Re-import depuis Excel avec correction des dates...')
  const XLSX = require(path.join(__dirname, '..', 'node_modules', 'xlsx'))
  const wb = XLSX.readFile(EXCEL_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, cellDates: true })

  function findConcession(nomExcel) {
    if (!nomExcel || !nomExcel.trim()) return null
    const n = String(nomExcel).trim().toUpperCase()
    const mapping = {
      'LOCALEASE': 'Localease', 'MARC NICE': 'Marc Auto Nice (Cupra/VW/Skoda/Audi)', 'MARC': 'Marc Auto Nice (Cupra/VW/Skoda/Audi)',
      'JEAN LAIN': 'Jean Lain Automobiles', 'JEAN LAIN ': 'Jean Lain Automobiles', 'RENAULT MEIGMAN': 'Renault Meigman',
      'AUDI SUMA VICHY': 'Audi Suma Vichy', 'BYD LYON': 'BYD Lyon', 'BMW ROYAL SA': 'BMW Royal SA',
      'HYUNDAI MONTARGIS': 'Hyundai Montargis', 'AUDI MARC': 'Marc Auto Nice (Cupra/VW/Skoda/Audi)',
      'FORD DIJON': 'Ford Dijon', 'TRIUMPH AMIEN': 'Triumph Amiens', 'AUDI BREST': 'Audi Brest',
      'ALEXIS HYUNDAI': 'Hyundai Alexis', 'HYUNDAI ALEXIS': 'Hyundai Alexis', 'MERCEDES LYON': 'Mercedes-Benz Lyon',
      'MERCEDES LYON ': 'Mercedes-Benz Lyon', 'GTA 38 ARTHUR': 'GTA 38 Arthur', 'BPM ORLEANS': 'BPM Orléans',
      'MORGAN JL': 'Morgan Jean Lain', 'TOYOTA GIEN': 'Toyota Gien', 'PORSCHE STRASBOURG': 'Porsche Strasbourg',
      'CITROEN ANNEMASSE': 'Citroën Annemasse', 'IVECO AUXERRE': 'Iveco Auxerre', 'LECAT': 'Lecat Automobiles',
      'LABEL AUTO': 'Label Auto', 'LOWCAZ SASSENAGE': 'Lowcaz Sassenage', 'AUDI CHAMBERY': 'Audi Chambéry',
      'ERIC CHOPARD': 'Eric Chopard Automobiles', 'MAX MG': 'Max MG Automobiles', 'ANTOINE ADENOT': 'Antoine Adenot Automobiles',
      'BYD ERIC': 'BYD Eric', 'JL BEN LACASSIN': 'Jean Lain Ben Lacassin', 'JL MAXENCE': 'Jean Lain Maxence',
      'YANNICK': 'Yannick Automobiles', 'ANTHONY': 'Anthony Auto',
    }
    if (mapping[n.trim()]) {
      const cp = queryOne('SELECT id FROM ContactPro WHERE entreprise=?', [mapping[n.trim()]])
      return cp?.id || null
    }
    const cp = queryOne('SELECT id FROM ContactPro WHERE UPPER(entreprise) LIKE ?', [`%${n}%`])
    return cp?.id || null
  }

  function mapFinancement(val) {
    if (!val) return 'LLD'
    const v = String(val).trim().toUpperCase()
    if (v.includes('CASH') || v.includes('CDB')) return 'CASH'
    if (v.includes('LOA')) return 'LOA'
    return 'LLD'
  }

  function mapStatut(commande, facture, paye) {
    if (paye && bool(paye)) return 'GAGNE'
    if (facture && bool(facture)) return 'GAGNE'
    if (commande && bool(commande)) return 'GAGNE'
    return 'OUVERT'
  }

  function mapCommissionStatut(facture, paye) {
    if (bool(paye)) return 'PAYEE'
    if (bool(facture)) return 'FACTUREE'
    return null
  }

  function mapType(val) {
    if (!val) return 'PARTICULIER'
    const v = String(val).trim().toUpperCase()
    if (v.includes('PRO')) return 'PROFESSIONNEL'
    return 'PARTICULIER'
  }

  let clientsCreated = 0, dossiersCreated = 0, skipped = 0, datesFixed = 0, datesMissing = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const nomPrenom = clean(row[1])
    if (!nomPrenom) { skipped++; continue }

    const parts = nomPrenom.split(' ')
    const nom = parts[0] || 'Inconnu'
    const prenom = parts.slice(1).join(' ')

    let clientId
    const existing = queryOne('SELECT id FROM Client WHERE nom=? AND prenom=?', [nom, prenom])
    if (!existing) {
      run('INSERT INTO Client (type,nom,prenom,telephone,email,estPremierAppelant,updatedAt) VALUES (?,?,?,?,?,?,datetime("now"))',
        [mapType(row[2]), nom, prenom, clean(row[3])||null, clean(row[4])||null, bool(row[15])])
      clientId = lastId()
      clientsCreated++
    } else {
      clientId = existing.id
    }

    const dateDemande = parseDate(row[0])
    if (dateDemande) datesFixed++
    else datesMissing++

    const numero = generateNumero()
    const contactProId = findConcession(row[11])
    const statut = mapStatut(row[13], row[14], row[16])
    const commStatut = mapCommissionStatut(row[14], row[16])

    run(
      `INSERT INTO Dossier (numeroDossier,clientId,dateDemande,typeFinancement,statut,marqueNom,modeleNom,energie,caracteristiques,valeurVehicule,loyerMensuel,premierLoyerMajore,dureeContrat,kilometrageContrat,apport,repriseOuiNon,contactProId,nomVendeur,dateCommande,commandeEffectuee,dateLivraisonPrevue,dateLivraisonReelle,montantCommission,statutCommission,dateFacturation,datePaiement,estChaud,notes,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime("now"))`,
      [
        numero, clientId,
        dateDemande || new Date().toISOString(),
        mapFinancement(row[5]),
        statut,
        clean(row[6]) || null,
        clean(row[7]) || null,
        clean(row[8]) || null,
        clean(row[9]) || null,
        parsePrice(row[17]) || null,
        parsePrice(row[18]) || null,
        parsePrice(row[19]) || null,
        null, null, null,
        bool(row[10]),
        contactProId,
        clean(row[12]) || null,
        parseDate(row[13]) || null,
        bool(row[13]) ? 1 : 0,
        parseDate(row[20]) || null,
        null,
        parsePrice(row[21]) || null,
        commStatut,
        parseDate(row[14]) || null,
        parseDate(row[16]) || null,
        0,
        clean(row[22]) || null
      ]
    )
    dossiersCreated++
  }

  saveDb()
  console.log(`  ✓ ${clientsCreated} clients créés`)
  console.log(`  ✓ ${dossiersCreated} dossiers créés`)
  console.log(`  ✓ ${datesFixed} dates correctement parsées`)
  console.log(`  ⚠ ${datesMissing} dates manquantes (cellule vide)`)
  if (skipped > 0) console.log(`  - ${skipped} lignes ignorées (sans nom)`)
  console.log('\n✅ Re-import terminé.')
}

main().catch(e => { console.error('Erreur:', e); process.exit(1) })
