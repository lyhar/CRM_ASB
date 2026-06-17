/**
 * Script d'import complet ASB CRM
 * - Import des concessions françaises
 * - Import des clients & dossiers depuis l'Excel
 */

const path = require('path')
const fs = require('fs')

const DB_PATH = 'C:\\Users\\levav\\AppData\\Roaming\\asb-crm\\crm.db'
const EXCEL_PATH = path.join(__dirname, '..', 'context', 'Fichier de suivi ASB (4).xlsx')

async function main() {
  // Charger sql.js
  const initSqlJs = require(path.join(__dirname, '..', 'node_modules', 'sql.js'))
  const SQL = await initSqlJs({
    locateFile: () => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  })

  // Charger la DB
  const dbBuffer = fs.readFileSync(DB_PATH)
  const db = new SQL.Database(dbBuffer)

  function run(sql, params = []) {
    db.run(sql, params)
  }

  function query(sql, params = []) {
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const rows = []
    while (stmt.step()) {
      const row = {}
      const cols = stmt.getColumnNames()
      const vals = stmt.get()
      cols.forEach((c, i) => { row[c] = vals[i] })
      rows.push(row)
    }
    stmt.free()
    return rows
  }

  function queryOne(sql, params = []) {
    const rows = query(sql, params)
    return rows.length > 0 ? rows[0] : null
  }

  function lastId() {
    return query('SELECT last_insert_rowid() as id')[0]?.id ?? 0
  }

  function saveDb() {
    const data = db.export()
    fs.writeFileSync(DB_PATH, Buffer.from(data))
  }

  function parsePrice(str) {
    if (!str) return null
    const s = String(str).replace(/[^0-9.,]/g, '').replace(',', '.').trim()
    const v = parseFloat(s)
    return isNaN(v) || v === 0 ? null : v
  }

  function parseDate(val) {
    if (!val) return null
    // Objet Date JS (produit par cellDates:true)
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null
      const y = val.getUTCFullYear(), m = String(val.getUTCMonth()+1).padStart(2,'0'), d = String(val.getUTCDate()).padStart(2,'0')
      return `${y}-${m}-${d}T00:00:00.000Z`
    }
    // Numéro de série Excel brut (raw:true sans cellDates)
    if (typeof val === 'number') {
      // Epoch Excel : 1 = 1900-01-01 (avec bug Excel de l'an 1900 bissextile)
      const epoch = (val > 59 ? val - 1 : val) - 1
      const d = new Date(Date.UTC(1900, 0, 1) + epoch * 86400000)
      if (isNaN(d.getTime())) return null
      const y = d.getUTCFullYear(), mo = String(d.getUTCMonth()+1).padStart(2,'0'), dy = String(d.getUTCDate()).padStart(2,'0')
      return `${y}-${mo}-${dy}T00:00:00.000Z`
    }
    const s = String(val).trim()
    if (!s) return null
    // format DD.MM.YYYY ou DD/MM/YYYY
    const m1 = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
    if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}T00:00:00.000Z`
    // format YYYY-MM-DD
    const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}T00:00:00.000Z`
    return null
  }

  function clean(str) {
    return str ? String(str).trim().replace(/\s+/g, ' ') : ''
  }

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

  // ─────────────────────────────────────────────────────────────────────────
  // 1. CONTACTS PRO — Concessions depuis l'Excel
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Import des concessions ASB (fichier Excel)...')

  const concessionsExcel = [
    { entreprise: 'Localease', ville: 'Nice', telephone: '', email: '', notes: 'Société de leasing LOA/LLD' },
    { entreprise: 'Marc Auto Nice (Cupra/VW/Skoda/Audi)', ville: 'Nice', telephone: '', email: '', notes: 'Groupe Marc — concession multimarque Nice' },
    { entreprise: 'Jean Lain Automobiles', ville: 'Bourg-en-Bresse', telephone: '04 74 22 11 00', email: 'contact@jeanlain.com', notes: 'Groupe Jean Lain — Savoie, Ain, multimarque' },
    { entreprise: 'Renault Meigman', ville: 'Paris', telephone: '', email: '', notes: 'Renault Paris' },
    { entreprise: 'Audi Suma Vichy', ville: 'Vichy', telephone: '', email: '', notes: 'Audi Vichy' },
    { entreprise: 'BYD Lyon', ville: 'Lyon', telephone: '', email: '', notes: 'Distributeur BYD Lyon' },
    { entreprise: 'BMW Royal SA', ville: 'Paris', telephone: '', email: '', notes: 'BMW Paris' },
    { entreprise: 'Hyundai Montargis', ville: 'Montargis', telephone: '', email: '', notes: 'Hyundai Montargis' },
    { entreprise: 'Ford Dijon', ville: 'Dijon', telephone: '', email: '', notes: 'Ford Dijon' },
    { entreprise: 'Triumph Amiens', ville: 'Amiens', telephone: '', email: '', notes: 'Triumph Moto Amiens' },
    { entreprise: 'Audi Brest', ville: 'Brest', telephone: '', email: '', notes: 'Audi Brest' },
    { entreprise: 'Hyundai Alexis', ville: 'Grenoble', telephone: '', email: '', notes: 'Hyundai Grenoble — Alexis' },
    { entreprise: 'Mercedes-Benz Lyon', ville: 'Lyon', telephone: '', email: '', notes: 'Mercedes Lyon' },
    { entreprise: 'GTA 38 Arthur', ville: 'Grenoble', telephone: '', email: '', notes: 'Isère (38)' },
    { entreprise: 'BPM Orléans', ville: 'Orléans', telephone: '', email: '', notes: 'BPM — Xpeng, multimaque Orléans' },
    { entreprise: 'Morgan Jean Lain', ville: 'Bourg-en-Bresse', telephone: '', email: '', notes: 'Jean Lain Morgan / VO' },
    { entreprise: 'Toyota Gien', ville: 'Gien', telephone: '', email: '', notes: 'Toyota Gien — Loiret' },
    { entreprise: 'Porsche Strasbourg', ville: 'Strasbourg', telephone: '', email: '', notes: 'Porsche Centre Strasbourg' },
    { entreprise: 'Citroën Annemasse', ville: 'Annemasse', telephone: '', email: '', notes: 'Citroën Annemasse — Haute-Savoie' },
    { entreprise: 'Iveco Auxerre', ville: 'Auxerre', telephone: '', email: '', notes: 'Iveco Auxerre — utilitaires & PL' },
    { entreprise: 'Lecat Automobiles', ville: '', telephone: '', email: '', notes: 'Partenaire ASB' },
    { entreprise: 'Label Auto', ville: '', telephone: '', email: '', notes: 'Partenaire ASB VO' },
    { entreprise: 'Lowcaz Sassenage', ville: 'Sassenage', telephone: '', email: '', notes: 'VO Isère (38)' },
    { entreprise: 'Audi Chambéry', ville: 'Chambéry', telephone: '', email: '', notes: 'Audi Chambéry — Savoie' },
    { entreprise: 'Eric Chopard Automobiles', ville: 'Beaune', telephone: '', email: '', notes: 'Groupe Chopard — Bourgogne, BYD/multimarque' },
    { entreprise: 'Max MG Automobiles', ville: '', telephone: '', email: '', notes: 'Distributeur MG' },
    { entreprise: 'Antoine Adenot Automobiles', ville: '', telephone: '', email: '', notes: 'Partenaire ASB — VO' },
    { entreprise: 'BYD Eric', ville: '', telephone: '', email: '', notes: 'Distributeur BYD' },
    { entreprise: 'Jean Lain Ben Lacassin', ville: 'Lyon', telephone: '', email: '', notes: 'Jean Lain Lyon — Ben Lacassin' },
    { entreprise: 'Jean Lain Maxence', ville: '', telephone: '', email: '', notes: 'Vendeur Jean Lain' },
    { entreprise: 'Yannick Automobiles', ville: '', telephone: '', email: '', notes: 'Partenaire ASB' },
    { entreprise: 'Anthony Auto', ville: '', telephone: '', email: '', notes: 'Partenaire ASB' },
  ]

  let concExcelCount = 0
  for (const c of concessionsExcel) {
    const ex = queryOne('SELECT id FROM ContactPro WHERE entreprise=?', [c.entreprise])
    if (!ex) {
      run('INSERT INTO ContactPro (nom,prenom,entreprise,ville,telephone,email,notes,updatedAt) VALUES (?,?,?,?,?,?,?,datetime("now"))',
        ['', '', c.entreprise, c.ville || '', c.telephone || '', c.email || '', c.notes || ''])
      concExcelCount++
    }
  }
  console.log(`  ✓ ${concExcelCount} concessions ASB ajoutées`)

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CONTACTS PRO — Grande base des concessions françaises
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Import de la base nationale des concessions françaises...')

  const concessionsNationales = [
    // ══════ AUDI ══════
    { entreprise: 'Audi Paris Ouest', ville: 'Paris 17e', notes: 'Audi Île-de-France' },
    { entreprise: 'Audi Paris Étoile', ville: 'Paris 8e', notes: 'Audi Île-de-France' },
    { entreprise: 'Audi Rouen', ville: 'Rouen', notes: 'Audi Normandie' },
    { entreprise: 'Audi Bordeaux', ville: 'Bordeaux', notes: 'Audi Nouvelle-Aquitaine' },
    { entreprise: 'Audi Marseille', ville: 'Marseille', notes: 'Audi PACA' },
    { entreprise: 'Audi Toulouse', ville: 'Toulouse', notes: 'Audi Occitanie' },
    { entreprise: 'Audi Nantes', ville: 'Nantes', notes: 'Audi Pays de Loire' },
    { entreprise: 'Audi Lille', ville: 'Lille', notes: 'Audi Hauts-de-France' },
    { entreprise: 'Audi Grenoble', ville: 'Grenoble', notes: 'Audi Auvergne-Rhône-Alpes' },
    { entreprise: 'Audi Montpellier', ville: 'Montpellier', notes: 'Audi Occitanie' },
    { entreprise: 'Audi Rennes', ville: 'Rennes', notes: 'Audi Bretagne' },
    { entreprise: 'Audi Metz', ville: 'Metz', notes: 'Audi Grand Est' },
    { entreprise: 'Audi Clermont-Ferrand', ville: 'Clermont-Ferrand', notes: 'Audi Auvergne' },
    { entreprise: 'Audi Nice', ville: 'Nice', notes: 'Audi Côte d\'Azur' },
    { entreprise: 'Audi Annecy', ville: 'Annecy', notes: 'Audi Haute-Savoie' },
    { entreprise: 'Audi Toulon', ville: 'Toulon', notes: 'Audi Var' },
    { entreprise: 'Audi Dijon', ville: 'Dijon', notes: 'Audi Bourgogne' },
    { entreprise: 'Audi Mulhouse', ville: 'Mulhouse', notes: 'Audi Alsace' },

    // ══════ BMW ══════
    { entreprise: 'BMW Paris 13', ville: 'Paris 13e', notes: 'BMW Île-de-France' },
    { entreprise: 'BMW Neuilly', ville: 'Neuilly-sur-Seine', notes: 'BMW Île-de-France' },
    { entreprise: 'BMW Levallois', ville: 'Levallois-Perret', notes: 'BMW Île-de-France' },
    { entreprise: 'BMW Lyon', ville: 'Lyon', notes: 'BMW Auvergne-Rhône-Alpes' },
    { entreprise: 'BMW Marseille', ville: 'Marseille', notes: 'BMW PACA' },
    { entreprise: 'BMW Bordeaux', ville: 'Bordeaux', notes: 'BMW Nouvelle-Aquitaine' },
    { entreprise: 'BMW Toulouse', ville: 'Toulouse', notes: 'BMW Occitanie' },
    { entreprise: 'BMW Nantes', ville: 'Nantes', notes: 'BMW Pays de Loire' },
    { entreprise: 'BMW Lille', ville: 'Lille', notes: 'BMW Hauts-de-France' },
    { entreprise: 'BMW Nice', ville: 'Nice', notes: 'BMW Côte d\'Azur' },
    { entreprise: 'BMW Strasbourg', ville: 'Strasbourg', notes: 'BMW Grand Est' },
    { entreprise: 'BMW Rennes', ville: 'Rennes', notes: 'BMW Bretagne' },
    { entreprise: 'BMW Grenoble', ville: 'Grenoble', notes: 'BMW Alpes' },
    { entreprise: 'BMW Annecy', ville: 'Annecy', notes: 'BMW Haute-Savoie' },
    { entreprise: 'BMW Montpellier', ville: 'Montpellier', notes: 'BMW Occitanie' },
    { entreprise: 'BMW Rouen', ville: 'Rouen', notes: 'BMW Normandie' },
    { entreprise: 'BMW Dijon', ville: 'Dijon', notes: 'BMW Bourgogne' },
    { entreprise: 'BMW Metz', ville: 'Metz', notes: 'BMW Lorraine' },
    { entreprise: 'BMW Toulon', ville: 'Toulon', notes: 'BMW Var' },
    { entreprise: 'BMW Clermont-Ferrand', ville: 'Clermont-Ferrand', notes: 'BMW Auvergne' },

    // ══════ MERCEDES-BENZ ══════
    { entreprise: 'Mercedes-Benz Paris', ville: 'Paris 17e', notes: 'Mercedes Île-de-France' },
    { entreprise: 'Mercedes-Benz Versailles', ville: 'Versailles', notes: 'Mercedes Île-de-France' },
    { entreprise: 'Mercedes-Benz Bordeaux', ville: 'Bordeaux', notes: 'Mercedes Nouvelle-Aquitaine' },
    { entreprise: 'Mercedes-Benz Marseille', ville: 'Marseille', notes: 'Mercedes PACA' },
    { entreprise: 'Mercedes-Benz Toulouse', ville: 'Toulouse', notes: 'Mercedes Occitanie' },
    { entreprise: 'Mercedes-Benz Nantes', ville: 'Nantes', notes: 'Mercedes Pays de Loire' },
    { entreprise: 'Mercedes-Benz Lille', ville: 'Lille', notes: 'Mercedes Hauts-de-France' },
    { entreprise: 'Mercedes-Benz Nice', ville: 'Nice', notes: 'Mercedes Côte d\'Azur' },
    { entreprise: 'Mercedes-Benz Strasbourg', ville: 'Strasbourg', notes: 'Mercedes Grand Est' },
    { entreprise: 'Mercedes-Benz Rennes', ville: 'Rennes', notes: 'Mercedes Bretagne' },
    { entreprise: 'Mercedes-Benz Grenoble', ville: 'Grenoble', notes: 'Mercedes Alpes' },
    { entreprise: 'Mercedes-Benz Montpellier', ville: 'Montpellier', notes: 'Mercedes Occitanie' },
    { entreprise: 'Mercedes-Benz Dijon', ville: 'Dijon', notes: 'Mercedes Bourgogne' },
    { entreprise: 'Mercedes-Benz Metz', ville: 'Metz', notes: 'Mercedes Lorraine' },
    { entreprise: 'Mercedes-Benz Annecy', ville: 'Annecy', notes: 'Mercedes Haute-Savoie' },
    { entreprise: 'Mercedes-Benz Toulon', ville: 'Toulon', notes: 'Mercedes Var' },
    { entreprise: 'Mercedes-Benz Clermont-Ferrand', ville: 'Clermont-Ferrand', notes: 'Mercedes Auvergne' },
    { entreprise: 'Mercedes-Benz Rouen', ville: 'Rouen', notes: 'Mercedes Normandie' },

    // ══════ VOLKSWAGEN ══════
    { entreprise: 'Volkswagen Paris Bercy', ville: 'Paris 12e', notes: 'VW Île-de-France' },
    { entreprise: 'Volkswagen Lyon', ville: 'Lyon', notes: 'VW Auvergne-Rhône-Alpes' },
    { entreprise: 'Volkswagen Marseille', ville: 'Marseille', notes: 'VW PACA' },
    { entreprise: 'Volkswagen Bordeaux', ville: 'Bordeaux', notes: 'VW Nouvelle-Aquitaine' },
    { entreprise: 'Volkswagen Toulouse', ville: 'Toulouse', notes: 'VW Occitanie' },
    { entreprise: 'Volkswagen Nantes', ville: 'Nantes', notes: 'VW Pays de Loire' },
    { entreprise: 'Volkswagen Lille', ville: 'Lille', notes: 'VW Hauts-de-France' },
    { entreprise: 'Volkswagen Nice', ville: 'Nice', notes: 'VW Côte d\'Azur' },
    { entreprise: 'Volkswagen Strasbourg', ville: 'Strasbourg', notes: 'VW Grand Est' },
    { entreprise: 'Volkswagen Rennes', ville: 'Rennes', notes: 'VW Bretagne' },
    { entreprise: 'Volkswagen Grenoble', ville: 'Grenoble', notes: 'VW Alpes' },
    { entreprise: 'Volkswagen Montpellier', ville: 'Montpellier', notes: 'VW Occitanie' },
    { entreprise: 'Volkswagen Dijon', ville: 'Dijon', notes: 'VW Bourgogne' },
    { entreprise: 'Volkswagen Rouen', ville: 'Rouen', notes: 'VW Normandie' },
    { entreprise: 'Volkswagen Annecy', ville: 'Annecy', notes: 'VW Haute-Savoie' },

    // ══════ PORSCHE ══════
    { entreprise: 'Porsche Centre Paris', ville: 'Paris 8e', notes: 'Porsche Île-de-France' },
    { entreprise: 'Porsche Centre Neuilly', ville: 'Neuilly-sur-Seine', notes: 'Porsche Île-de-France' },
    { entreprise: 'Porsche Centre Lyon', ville: 'Lyon', notes: 'Porsche Auvergne-Rhône-Alpes' },
    { entreprise: 'Porsche Centre Marseille', ville: 'Marseille', notes: 'Porsche PACA' },
    { entreprise: 'Porsche Centre Bordeaux', ville: 'Bordeaux', notes: 'Porsche Nouvelle-Aquitaine' },
    { entreprise: 'Porsche Centre Toulouse', ville: 'Toulouse', notes: 'Porsche Occitanie' },
    { entreprise: 'Porsche Centre Nice', ville: 'Nice', notes: 'Porsche Côte d\'Azur' },
    { entreprise: 'Porsche Centre Nantes', ville: 'Nantes', notes: 'Porsche Pays de Loire' },
    { entreprise: 'Porsche Centre Lille', ville: 'Lille', notes: 'Porsche Hauts-de-France' },
    { entreprise: 'Porsche Centre Genève', ville: 'Genève', notes: 'Porsche Suisse romande' },
    { entreprise: 'Porsche Centre Annecy', ville: 'Annecy', notes: 'Porsche Haute-Savoie' },
    { entreprise: 'Porsche Centre Rouen', ville: 'Rouen', notes: 'Porsche Normandie' },
    { entreprise: 'Porsche Centre Grenoble', ville: 'Grenoble', notes: 'Porsche Isère' },
    { entreprise: 'Porsche Centre Rennes', ville: 'Rennes', notes: 'Porsche Bretagne' },
    { entreprise: 'Porsche Centre Montpellier', ville: 'Montpellier', notes: 'Porsche Occitanie' },

    // ══════ RENAULT ══════
    { entreprise: 'Renault Paris 15', ville: 'Paris 15e', notes: 'Renault Île-de-France' },
    { entreprise: 'Renault Lyon Confluences', ville: 'Lyon', notes: 'Renault Auvergne-Rhône-Alpes' },
    { entreprise: 'Renault Marseille', ville: 'Marseille', notes: 'Renault PACA' },
    { entreprise: 'Renault Bordeaux', ville: 'Bordeaux', notes: 'Renault Nouvelle-Aquitaine' },
    { entreprise: 'Renault Toulouse', ville: 'Toulouse', notes: 'Renault Occitanie' },
    { entreprise: 'Renault Nantes', ville: 'Nantes', notes: 'Renault Pays de Loire' },
    { entreprise: 'Renault Lille', ville: 'Lille', notes: 'Renault Hauts-de-France' },
    { entreprise: 'Renault Nice', ville: 'Nice', notes: 'Renault Côte d\'Azur' },
    { entreprise: 'Renault Strasbourg', ville: 'Strasbourg', notes: 'Renault Grand Est' },
    { entreprise: 'Renault Rennes', ville: 'Rennes', notes: 'Renault Bretagne' },
    { entreprise: 'Renault Grenoble', ville: 'Grenoble', notes: 'Renault Alpes' },
    { entreprise: 'Renault Montpellier', ville: 'Montpellier', notes: 'Renault Occitanie' },
    { entreprise: 'Renault Dijon', ville: 'Dijon', notes: 'Renault Bourgogne' },
    { entreprise: 'Renault Annecy', ville: 'Annecy', notes: 'Renault Haute-Savoie' },
    { entreprise: 'Renault Rouen', ville: 'Rouen', notes: 'Renault Normandie' },
    { entreprise: 'Renault Metz', ville: 'Metz', notes: 'Renault Lorraine' },
    { entreprise: 'Renault Clermont-Ferrand', ville: 'Clermont-Ferrand', notes: 'Renault Auvergne' },
    { entreprise: 'Renault Toulon', ville: 'Toulon', notes: 'Renault Var' },

    // ══════ PEUGEOT ══════
    { entreprise: 'Peugeot Paris Nation', ville: 'Paris 11e', notes: 'Peugeot Île-de-France' },
    { entreprise: 'Peugeot Lyon', ville: 'Lyon', notes: 'Peugeot Auvergne-Rhône-Alpes' },
    { entreprise: 'Peugeot Marseille', ville: 'Marseille', notes: 'Peugeot PACA' },
    { entreprise: 'Peugeot Bordeaux', ville: 'Bordeaux', notes: 'Peugeot Nouvelle-Aquitaine' },
    { entreprise: 'Peugeot Toulouse', ville: 'Toulouse', notes: 'Peugeot Occitanie' },
    { entreprise: 'Peugeot Nantes', ville: 'Nantes', notes: 'Peugeot Pays de Loire' },
    { entreprise: 'Peugeot Lille', ville: 'Lille', notes: 'Peugeot Hauts-de-France' },
    { entreprise: 'Peugeot Nice', ville: 'Nice', notes: 'Peugeot Côte d\'Azur' },
    { entreprise: 'Peugeot Strasbourg', ville: 'Strasbourg', notes: 'Peugeot Grand Est' },
    { entreprise: 'Peugeot Rennes', ville: 'Rennes', notes: 'Peugeot Bretagne' },
    { entreprise: 'Peugeot Grenoble', ville: 'Grenoble', notes: 'Peugeot Alpes' },
    { entreprise: 'Peugeot Montpellier', ville: 'Montpellier', notes: 'Peugeot Occitanie' },
    { entreprise: 'Peugeot Dijon', ville: 'Dijon', notes: 'Peugeot Bourgogne' },
    { entreprise: 'Peugeot Annecy', ville: 'Annecy', notes: 'Peugeot Haute-Savoie' },
    { entreprise: 'Peugeot Rouen', ville: 'Rouen', notes: 'Peugeot Normandie' },
    { entreprise: 'Peugeot Metz', ville: 'Metz', notes: 'Peugeot Lorraine' },
    { entreprise: 'Peugeot Toulon', ville: 'Toulon', notes: 'Peugeot Var' },
    { entreprise: 'Peugeot Clermont-Ferrand', ville: 'Clermont-Ferrand', notes: 'Peugeot Auvergne' },

    // ══════ CITROËN ══════
    { entreprise: 'Citroën Paris Champs-Élysées', ville: 'Paris 8e', notes: 'Flagship Citroën' },
    { entreprise: 'Citroën Lyon', ville: 'Lyon', notes: 'Citroën Auvergne-Rhône-Alpes' },
    { entreprise: 'Citroën Marseille', ville: 'Marseille', notes: 'Citroën PACA' },
    { entreprise: 'Citroën Bordeaux', ville: 'Bordeaux', notes: 'Citroën Nouvelle-Aquitaine' },
    { entreprise: 'Citroën Toulouse', ville: 'Toulouse', notes: 'Citroën Occitanie' },
    { entreprise: 'Citroën Nantes', ville: 'Nantes', notes: 'Citroën Pays de Loire' },
    { entreprise: 'Citroën Lille', ville: 'Lille', notes: 'Citroën Hauts-de-France' },
    { entreprise: 'Citroën Nice', ville: 'Nice', notes: 'Citroën Côte d\'Azur' },
    { entreprise: 'Citroën Strasbourg', ville: 'Strasbourg', notes: 'Citroën Grand Est' },
    { entreprise: 'Citroën Rennes', ville: 'Rennes', notes: 'Citroën Bretagne' },
    { entreprise: 'Citroën Grenoble', ville: 'Grenoble', notes: 'Citroën Alpes' },
    { entreprise: 'Citroën Montpellier', ville: 'Montpellier', notes: 'Citroën Occitanie' },
    { entreprise: 'Citroën Dijon', ville: 'Dijon', notes: 'Citroën Bourgogne' },
    { entreprise: 'Citroën Rouen', ville: 'Rouen', notes: 'Citroën Normandie' },
    { entreprise: 'Citroën Toulon', ville: 'Toulon', notes: 'Citroën Var' },

    // ══════ DS AUTOMOBILES ══════
    { entreprise: 'DS Store Paris', ville: 'Paris 8e', notes: 'DS Automobiles flagship' },
    { entreprise: 'DS Store Lyon', ville: 'Lyon', notes: 'DS Automobiles Lyon' },
    { entreprise: 'DS Store Nice', ville: 'Nice', notes: 'DS Automobiles Côte d\'Azur' },
    { entreprise: 'DS Store Marseille', ville: 'Marseille', notes: 'DS Automobiles PACA' },
    { entreprise: 'DS Store Bordeaux', ville: 'Bordeaux', notes: 'DS Automobiles Nouvelle-Aquitaine' },

    // ══════ TOYOTA ══════
    { entreprise: 'Toyota Paris Est', ville: 'Paris 20e', notes: 'Toyota Île-de-France' },
    { entreprise: 'Toyota Lyon', ville: 'Lyon', notes: 'Toyota Auvergne-Rhône-Alpes' },
    { entreprise: 'Toyota Marseille', ville: 'Marseille', notes: 'Toyota PACA' },
    { entreprise: 'Toyota Bordeaux', ville: 'Bordeaux', notes: 'Toyota Nouvelle-Aquitaine' },
    { entreprise: 'Toyota Toulouse', ville: 'Toulouse', notes: 'Toyota Occitanie' },
    { entreprise: 'Toyota Nantes', ville: 'Nantes', notes: 'Toyota Pays de Loire' },
    { entreprise: 'Toyota Lille', ville: 'Lille', notes: 'Toyota Hauts-de-France' },
    { entreprise: 'Toyota Nice', ville: 'Nice', notes: 'Toyota Côte d\'Azur' },
    { entreprise: 'Toyota Strasbourg', ville: 'Strasbourg', notes: 'Toyota Grand Est' },
    { entreprise: 'Toyota Rennes', ville: 'Rennes', notes: 'Toyota Bretagne' },
    { entreprise: 'Toyota Grenoble', ville: 'Grenoble', notes: 'Toyota Alpes' },
    { entreprise: 'Toyota Montpellier', ville: 'Montpellier', notes: 'Toyota Occitanie' },
    { entreprise: 'Toyota Dijon', ville: 'Dijon', notes: 'Toyota Bourgogne' },
    { entreprise: 'Toyota Annecy', ville: 'Annecy', notes: 'Toyota Haute-Savoie' },
    { entreprise: 'Toyota Toulon', ville: 'Toulon', notes: 'Toyota Var' },

    // ══════ HYUNDAI ══════
    { entreprise: 'Hyundai Paris', ville: 'Paris', notes: 'Hyundai Île-de-France' },
    { entreprise: 'Hyundai Lyon', ville: 'Lyon', notes: 'Hyundai Auvergne-Rhône-Alpes' },
    { entreprise: 'Hyundai Marseille', ville: 'Marseille', notes: 'Hyundai PACA' },
    { entreprise: 'Hyundai Bordeaux', ville: 'Bordeaux', notes: 'Hyundai Nouvelle-Aquitaine' },
    { entreprise: 'Hyundai Toulouse', ville: 'Toulouse', notes: 'Hyundai Occitanie' },
    { entreprise: 'Hyundai Nantes', ville: 'Nantes', notes: 'Hyundai Pays de Loire' },
    { entreprise: 'Hyundai Lille', ville: 'Lille', notes: 'Hyundai Hauts-de-France' },
    { entreprise: 'Hyundai Nice', ville: 'Nice', notes: 'Hyundai Côte d\'Azur' },
    { entreprise: 'Hyundai Strasbourg', ville: 'Strasbourg', notes: 'Hyundai Grand Est' },
    { entreprise: 'Hyundai Rennes', ville: 'Rennes', notes: 'Hyundai Bretagne' },
    { entreprise: 'Hyundai Grenoble', ville: 'Grenoble', notes: 'Hyundai Alpes' },
    { entreprise: 'Hyundai Montpellier', ville: 'Montpellier', notes: 'Hyundai Occitanie' },
    { entreprise: 'Hyundai Toulon', ville: 'Toulon', notes: 'Hyundai Var' },
    { entreprise: 'Hyundai Annecy', ville: 'Annecy', notes: 'Hyundai Haute-Savoie' },
    { entreprise: 'Hyundai Dijon', ville: 'Dijon', notes: 'Hyundai Bourgogne' },
    { entreprise: 'Hyundai Rouen', ville: 'Rouen', notes: 'Hyundai Normandie' },
    { entreprise: 'Hyundai Metz', ville: 'Metz', notes: 'Hyundai Lorraine' },
    { entreprise: 'Hyundai Clermont-Ferrand', ville: 'Clermont-Ferrand', notes: 'Hyundai Auvergne' },

    // ══════ KIA ══════
    { entreprise: 'Kia Paris', ville: 'Paris', notes: 'Kia Île-de-France' },
    { entreprise: 'Kia Lyon', ville: 'Lyon', notes: 'Kia Auvergne-Rhône-Alpes' },
    { entreprise: 'Kia Marseille', ville: 'Marseille', notes: 'Kia PACA' },
    { entreprise: 'Kia Bordeaux', ville: 'Bordeaux', notes: 'Kia Nouvelle-Aquitaine' },
    { entreprise: 'Kia Toulouse', ville: 'Toulouse', notes: 'Kia Occitanie' },
    { entreprise: 'Kia Nantes', ville: 'Nantes', notes: 'Kia Pays de Loire' },
    { entreprise: 'Kia Lille', ville: 'Lille', notes: 'Kia Hauts-de-France' },
    { entreprise: 'Kia Nice', ville: 'Nice', notes: 'Kia Côte d\'Azur' },
    { entreprise: 'Kia Strasbourg', ville: 'Strasbourg', notes: 'Kia Grand Est' },
    { entreprise: 'Kia Rennes', ville: 'Rennes', notes: 'Kia Bretagne' },
    { entreprise: 'Kia Grenoble', ville: 'Grenoble', notes: 'Kia Alpes' },

    // ══════ SKODA ══════
    { entreprise: 'Skoda Paris', ville: 'Paris', notes: 'Skoda Île-de-France' },
    { entreprise: 'Skoda Lyon', ville: 'Lyon', notes: 'Skoda Auvergne-Rhône-Alpes' },
    { entreprise: 'Skoda Marseille', ville: 'Marseille', notes: 'Skoda PACA' },
    { entreprise: 'Skoda Bordeaux', ville: 'Bordeaux', notes: 'Skoda Nouvelle-Aquitaine' },
    { entreprise: 'Skoda Toulouse', ville: 'Toulouse', notes: 'Skoda Occitanie' },
    { entreprise: 'Skoda Nantes', ville: 'Nantes', notes: 'Skoda Pays de Loire' },
    { entreprise: 'Skoda Lille', ville: 'Lille', notes: 'Skoda Hauts-de-France' },
    { entreprise: 'Skoda Nice', ville: 'Nice', notes: 'Skoda Côte d\'Azur' },
    { entreprise: 'Skoda Strasbourg', ville: 'Strasbourg', notes: 'Skoda Grand Est' },
    { entreprise: 'Skoda Rennes', ville: 'Rennes', notes: 'Skoda Bretagne' },
    { entreprise: 'Skoda Grenoble', ville: 'Grenoble', notes: 'Skoda Alpes' },
    { entreprise: 'Skoda Montpellier', ville: 'Montpellier', notes: 'Skoda Occitanie' },
    { entreprise: 'Skoda Dijon', ville: 'Dijon', notes: 'Skoda Bourgogne' },
    { entreprise: 'Skoda Annecy', ville: 'Annecy', notes: 'Skoda Haute-Savoie' },
    { entreprise: 'Skoda Rouen', ville: 'Rouen', notes: 'Skoda Normandie' },

    // ══════ SEAT / CUPRA ══════
    { entreprise: 'Cupra Paris', ville: 'Paris', notes: 'Cupra City Garage Île-de-France' },
    { entreprise: 'Cupra Lyon', ville: 'Lyon', notes: 'Cupra Auvergne-Rhône-Alpes' },
    { entreprise: 'Cupra Nice', ville: 'Nice', notes: 'Cupra Côte d\'Azur' },
    { entreprise: 'Cupra Marseille', ville: 'Marseille', notes: 'Cupra PACA' },
    { entreprise: 'Cupra Bordeaux', ville: 'Bordeaux', notes: 'Cupra Nouvelle-Aquitaine' },
    { entreprise: 'Cupra Toulouse', ville: 'Toulouse', notes: 'Cupra Occitanie' },
    { entreprise: 'Cupra Nantes', ville: 'Nantes', notes: 'Cupra Pays de Loire' },
    { entreprise: 'Cupra Lille', ville: 'Lille', notes: 'Cupra Hauts-de-France' },
    { entreprise: 'Cupra Strasbourg', ville: 'Strasbourg', notes: 'Cupra Grand Est' },
    { entreprise: 'Cupra Grenoble', ville: 'Grenoble', notes: 'Cupra Alpes' },
    { entreprise: 'Cupra Montpellier', ville: 'Montpellier', notes: 'Cupra Occitanie' },
    { entreprise: 'Cupra Annecy', ville: 'Annecy', notes: 'Cupra Haute-Savoie' },
    { entreprise: 'Cupra Rennes', ville: 'Rennes', notes: 'Cupra Bretagne' },
    { entreprise: 'Cupra Dijon', ville: 'Dijon', notes: 'Cupra Bourgogne' },
    { entreprise: 'Seat Paris', ville: 'Paris', notes: 'Seat Île-de-France' },
    { entreprise: 'Seat Lyon', ville: 'Lyon', notes: 'Seat Auvergne-Rhône-Alpes' },

    // ══════ TESLA ══════
    { entreprise: 'Tesla Paris Opera', ville: 'Paris 9e', notes: 'Tesla Store Île-de-France' },
    { entreprise: 'Tesla Paris La Défense', ville: 'La Défense', notes: 'Tesla Store Île-de-France' },
    { entreprise: 'Tesla Lyon', ville: 'Lyon', notes: 'Tesla Store Auvergne-Rhône-Alpes' },
    { entreprise: 'Tesla Marseille', ville: 'Marseille', notes: 'Tesla Store PACA' },
    { entreprise: 'Tesla Bordeaux', ville: 'Bordeaux', notes: 'Tesla Store Nouvelle-Aquitaine' },
    { entreprise: 'Tesla Toulouse', ville: 'Toulouse', notes: 'Tesla Store Occitanie' },
    { entreprise: 'Tesla Nantes', ville: 'Nantes', notes: 'Tesla Store Pays de Loire' },
    { entreprise: 'Tesla Lille', ville: 'Lille', notes: 'Tesla Store Hauts-de-France' },
    { entreprise: 'Tesla Nice', ville: 'Nice', notes: 'Tesla Store Côte d\'Azur' },
    { entreprise: 'Tesla Strasbourg', ville: 'Strasbourg', notes: 'Tesla Store Grand Est' },
    { entreprise: 'Tesla Grenoble', ville: 'Grenoble', notes: 'Tesla Store Alpes' },
    { entreprise: 'Tesla Rennes', ville: 'Rennes', notes: 'Tesla Store Bretagne' },
    { entreprise: 'Tesla Montpellier', ville: 'Montpellier', notes: 'Tesla Store Occitanie' },
    { entreprise: 'Tesla Annecy', ville: 'Annecy', notes: 'Tesla Store Haute-Savoie' },

    // ══════ FERRARI ══════
    { entreprise: 'Ferrari Paris', ville: 'Paris 16e', notes: 'Ferrari Île-de-France' },
    { entreprise: 'Ferrari Lyon', ville: 'Lyon', notes: 'Ferrari Auvergne-Rhône-Alpes' },
    { entreprise: 'Ferrari Marseille', ville: 'Marseille', notes: 'Ferrari PACA' },
    { entreprise: 'Ferrari Nice', ville: 'Nice', notes: 'Ferrari Côte d\'Azur' },
    { entreprise: 'Ferrari Bordeaux', ville: 'Bordeaux', notes: 'Ferrari Nouvelle-Aquitaine' },
    { entreprise: 'Ferrari Toulouse', ville: 'Toulouse', notes: 'Ferrari Occitanie' },
    { entreprise: 'Ferrari Strasbourg', ville: 'Strasbourg', notes: 'Ferrari Grand Est' },
    { entreprise: 'Ferrari Genève', ville: 'Genève', notes: 'Ferrari Suisse romande' },

    // ══════ LAMBORGHINI ══════
    { entreprise: 'Lamborghini Paris', ville: 'Paris 16e', notes: 'Lamborghini Île-de-France' },
    { entreprise: 'Lamborghini Lyon', ville: 'Lyon', notes: 'Lamborghini Auvergne-Rhône-Alpes' },
    { entreprise: 'Lamborghini Nice', ville: 'Nice', notes: 'Lamborghini Côte d\'Azur' },
    { entreprise: 'Lamborghini Bordeaux', ville: 'Bordeaux', notes: 'Lamborghini Nouvelle-Aquitaine' },

    // ══════ MASERATI ══════
    { entreprise: 'Maserati Paris', ville: 'Paris 16e', notes: 'Maserati Île-de-France' },
    { entreprise: 'Maserati Lyon', ville: 'Lyon', notes: 'Maserati Auvergne-Rhône-Alpes' },
    { entreprise: 'Maserati Nice', ville: 'Nice', notes: 'Maserati Côte d\'Azur' },
    { entreprise: 'Maserati Marseille', ville: 'Marseille', notes: 'Maserati PACA' },

    // ══════ BENTLEY ══════
    { entreprise: 'Bentley Paris', ville: 'Paris 8e', notes: 'Bentley Île-de-France' },
    { entreprise: 'Bentley Lyon', ville: 'Lyon', notes: 'Bentley Auvergne-Rhône-Alpes' },
    { entreprise: 'Bentley Nice', ville: 'Nice', notes: 'Bentley Côte d\'Azur' },

    // ══════ ROLLS-ROYCE ══════
    { entreprise: 'Rolls-Royce Paris', ville: 'Paris 8e', notes: 'Rolls-Royce Île-de-France' },

    // ══════ ASTON MARTIN ══════
    { entreprise: 'Aston Martin Paris', ville: 'Paris 8e', notes: 'Aston Martin Île-de-France' },
    { entreprise: 'Aston Martin Lyon', ville: 'Lyon', notes: 'Aston Martin Auvergne-Rhône-Alpes' },
    { entreprise: 'Aston Martin Nice', ville: 'Nice', notes: 'Aston Martin Côte d\'Azur' },

    // ══════ ALFA ROMEO ══════
    { entreprise: 'Alfa Romeo Paris', ville: 'Paris', notes: 'Alfa Romeo Île-de-France' },
    { entreprise: 'Alfa Romeo Lyon', ville: 'Lyon', notes: 'Alfa Romeo Auvergne-Rhône-Alpes' },
    { entreprise: 'Alfa Romeo Marseille', ville: 'Marseille', notes: 'Alfa Romeo PACA' },
    { entreprise: 'Alfa Romeo Nice', ville: 'Nice', notes: 'Alfa Romeo Côte d\'Azur' },
    { entreprise: 'Alfa Romeo Bordeaux', ville: 'Bordeaux', notes: 'Alfa Romeo Nouvelle-Aquitaine' },
    { entreprise: 'Alfa Romeo Toulouse', ville: 'Toulouse', notes: 'Alfa Romeo Occitanie' },

    // ══════ JEEP ══════
    { entreprise: 'Jeep Paris', ville: 'Paris', notes: 'Jeep Île-de-France' },
    { entreprise: 'Jeep Lyon', ville: 'Lyon', notes: 'Jeep Auvergne-Rhône-Alpes' },
    { entreprise: 'Jeep Marseille', ville: 'Marseille', notes: 'Jeep PACA' },
    { entreprise: 'Jeep Bordeaux', ville: 'Bordeaux', notes: 'Jeep Nouvelle-Aquitaine' },
    { entreprise: 'Jeep Toulouse', ville: 'Toulouse', notes: 'Jeep Occitanie' },
    { entreprise: 'Jeep Nice', ville: 'Nice', notes: 'Jeep Côte d\'Azur' },

    // ══════ VOLVO ══════
    { entreprise: 'Volvo Paris', ville: 'Paris', notes: 'Volvo Île-de-France' },
    { entreprise: 'Volvo Lyon', ville: 'Lyon', notes: 'Volvo Auvergne-Rhône-Alpes' },
    { entreprise: 'Volvo Marseille', ville: 'Marseille', notes: 'Volvo PACA' },
    { entreprise: 'Volvo Bordeaux', ville: 'Bordeaux', notes: 'Volvo Nouvelle-Aquitaine' },
    { entreprise: 'Volvo Toulouse', ville: 'Toulouse', notes: 'Volvo Occitanie' },
    { entreprise: 'Volvo Nantes', ville: 'Nantes', notes: 'Volvo Pays de Loire' },
    { entreprise: 'Volvo Lille', ville: 'Lille', notes: 'Volvo Hauts-de-France' },
    { entreprise: 'Volvo Nice', ville: 'Nice', notes: 'Volvo Côte d\'Azur' },
    { entreprise: 'Volvo Strasbourg', ville: 'Strasbourg', notes: 'Volvo Grand Est' },
    { entreprise: 'Volvo Rennes', ville: 'Rennes', notes: 'Volvo Bretagne' },
    { entreprise: 'Volvo Grenoble', ville: 'Grenoble', notes: 'Volvo Alpes' },
    { entreprise: 'Volvo Montpellier', ville: 'Montpellier', notes: 'Volvo Occitanie' },

    // ══════ FORD ══════
    { entreprise: 'Ford Paris', ville: 'Paris', notes: 'Ford Île-de-France' },
    { entreprise: 'Ford Lyon', ville: 'Lyon', notes: 'Ford Auvergne-Rhône-Alpes' },
    { entreprise: 'Ford Marseille', ville: 'Marseille', notes: 'Ford PACA' },
    { entreprise: 'Ford Bordeaux', ville: 'Bordeaux', notes: 'Ford Nouvelle-Aquitaine' },
    { entreprise: 'Ford Toulouse', ville: 'Toulouse', notes: 'Ford Occitanie' },
    { entreprise: 'Ford Nantes', ville: 'Nantes', notes: 'Ford Pays de Loire' },
    { entreprise: 'Ford Lille', ville: 'Lille', notes: 'Ford Hauts-de-France' },
    { entreprise: 'Ford Nice', ville: 'Nice', notes: 'Ford Côte d\'Azur' },
    { entreprise: 'Ford Strasbourg', ville: 'Strasbourg', notes: 'Ford Grand Est' },
    { entreprise: 'Ford Rennes', ville: 'Rennes', notes: 'Ford Bretagne' },
    { entreprise: 'Ford Grenoble', ville: 'Grenoble', notes: 'Ford Alpes' },
    { entreprise: 'Ford Rouen', ville: 'Rouen', notes: 'Ford Normandie' },
    { entreprise: 'Ford Metz', ville: 'Metz', notes: 'Ford Lorraine' },

    // ══════ NISSAN ══════
    { entreprise: 'Nissan Paris', ville: 'Paris', notes: 'Nissan Île-de-France' },
    { entreprise: 'Nissan Lyon', ville: 'Lyon', notes: 'Nissan Auvergne-Rhône-Alpes' },
    { entreprise: 'Nissan Marseille', ville: 'Marseille', notes: 'Nissan PACA' },
    { entreprise: 'Nissan Bordeaux', ville: 'Bordeaux', notes: 'Nissan Nouvelle-Aquitaine' },
    { entreprise: 'Nissan Toulouse', ville: 'Toulouse', notes: 'Nissan Occitanie' },
    { entreprise: 'Nissan Nantes', ville: 'Nantes', notes: 'Nissan Pays de Loire' },
    { entreprise: 'Nissan Lille', ville: 'Lille', notes: 'Nissan Hauts-de-France' },
    { entreprise: 'Nissan Nice', ville: 'Nice', notes: 'Nissan Côte d\'Azur' },
    { entreprise: 'Nissan Strasbourg', ville: 'Strasbourg', notes: 'Nissan Grand Est' },
    { entreprise: 'Nissan Rennes', ville: 'Rennes', notes: 'Nissan Bretagne' },
    { entreprise: 'Nissan Grenoble', ville: 'Grenoble', notes: 'Nissan Alpes' },
    { entreprise: 'Nissan Montpellier', ville: 'Montpellier', notes: 'Nissan Occitanie' },

    // ══════ MITSUBISHI ══════
    { entreprise: 'Mitsubishi Paris', ville: 'Paris', notes: 'Mitsubishi Île-de-France' },
    { entreprise: 'Mitsubishi Lyon', ville: 'Lyon', notes: 'Mitsubishi Auvergne-Rhône-Alpes' },
    { entreprise: 'Mitsubishi Bordeaux', ville: 'Bordeaux', notes: 'Mitsubishi Nouvelle-Aquitaine' },
    { entreprise: 'Mitsubishi Toulouse', ville: 'Toulouse', notes: 'Mitsubishi Occitanie' },

    // ══════ MG ══════
    { entreprise: 'MG Paris', ville: 'Paris', notes: 'MG Motor Île-de-France' },
    { entreprise: 'MG Lyon', ville: 'Lyon', notes: 'MG Motor Auvergne-Rhône-Alpes' },
    { entreprise: 'MG Marseille', ville: 'Marseille', notes: 'MG Motor PACA' },
    { entreprise: 'MG Bordeaux', ville: 'Bordeaux', notes: 'MG Motor Nouvelle-Aquitaine' },
    { entreprise: 'MG Toulouse', ville: 'Toulouse', notes: 'MG Motor Occitanie' },
    { entreprise: 'MG Nantes', ville: 'Nantes', notes: 'MG Motor Pays de Loire' },
    { entreprise: 'MG Lille', ville: 'Lille', notes: 'MG Motor Hauts-de-France' },
    { entreprise: 'MG Nice', ville: 'Nice', notes: 'MG Motor Côte d\'Azur' },
    { entreprise: 'MG Grenoble', ville: 'Grenoble', notes: 'MG Motor Alpes' },

    // ══════ BYD ══════
    { entreprise: 'BYD Paris', ville: 'Paris', notes: 'BYD Île-de-France' },
    { entreprise: 'BYD Marseille', ville: 'Marseille', notes: 'BYD PACA' },
    { entreprise: 'BYD Bordeaux', ville: 'Bordeaux', notes: 'BYD Nouvelle-Aquitaine' },
    { entreprise: 'BYD Toulouse', ville: 'Toulouse', notes: 'BYD Occitanie' },
    { entreprise: 'BYD Nantes', ville: 'Nantes', notes: 'BYD Pays de Loire' },
    { entreprise: 'BYD Lille', ville: 'Lille', notes: 'BYD Hauts-de-France' },
    { entreprise: 'BYD Nice', ville: 'Nice', notes: 'BYD Côte d\'Azur' },
    { entreprise: 'BYD Strasbourg', ville: 'Strasbourg', notes: 'BYD Grand Est' },
    { entreprise: 'BYD Grenoble', ville: 'Grenoble', notes: 'BYD Alpes' },
    { entreprise: 'BYD Rennes', ville: 'Rennes', notes: 'BYD Bretagne' },

    // ══════ DUCATI ══════
    { entreprise: 'Ducati Paris', ville: 'Paris', notes: 'Ducati Store Île-de-France' },
    { entreprise: 'Ducati Lyon', ville: 'Lyon', notes: 'Ducati Auvergne-Rhône-Alpes' },
    { entreprise: 'Ducati Marseille', ville: 'Marseille', notes: 'Ducati PACA' },
    { entreprise: 'Ducati Nice', ville: 'Nice', notes: 'Ducati Côte d\'Azur' },
    { entreprise: 'Ducati Bordeaux', ville: 'Bordeaux', notes: 'Ducati Nouvelle-Aquitaine' },
    { entreprise: 'Ducati Toulouse', ville: 'Toulouse', notes: 'Ducati Occitanie' },
    { entreprise: 'Ducati Strasbourg', ville: 'Strasbourg', notes: 'Ducati Grand Est' },

    // ══════ BMW MOTORRAD ══════
    { entreprise: 'BMW Motorrad Paris', ville: 'Paris', notes: 'BMW Moto Île-de-France' },
    { entreprise: 'BMW Motorrad Lyon', ville: 'Lyon', notes: 'BMW Moto Auvergne-Rhône-Alpes' },
    { entreprise: 'BMW Motorrad Marseille', ville: 'Marseille', notes: 'BMW Moto PACA' },
    { entreprise: 'BMW Motorrad Nice', ville: 'Nice', notes: 'BMW Moto Côte d\'Azur' },
    { entreprise: 'BMW Motorrad Bordeaux', ville: 'Bordeaux', notes: 'BMW Moto Nouvelle-Aquitaine' },
    { entreprise: 'BMW Motorrad Toulouse', ville: 'Toulouse', notes: 'BMW Moto Occitanie' },
    { entreprise: 'BMW Motorrad Strasbourg', ville: 'Strasbourg', notes: 'BMW Moto Grand Est' },
    { entreprise: 'BMW Motorrad Grenoble', ville: 'Grenoble', notes: 'BMW Moto Alpes' },
    { entreprise: 'BMW Motorrad Rennes', ville: 'Rennes', notes: 'BMW Moto Bretagne' },

    // ══════ TRIUMPH ══════
    { entreprise: 'Triumph Paris', ville: 'Paris', notes: 'Triumph Moto Île-de-France' },
    { entreprise: 'Triumph Lyon', ville: 'Lyon', notes: 'Triumph Moto Auvergne-Rhône-Alpes' },
    { entreprise: 'Triumph Marseille', ville: 'Marseille', notes: 'Triumph Moto PACA' },
    { entreprise: 'Triumph Nice', ville: 'Nice', notes: 'Triumph Moto Côte d\'Azur' },
    { entreprise: 'Triumph Bordeaux', ville: 'Bordeaux', notes: 'Triumph Moto Nouvelle-Aquitaine' },
    { entreprise: 'Triumph Toulouse', ville: 'Toulouse', notes: 'Triumph Moto Occitanie' },
    { entreprise: 'Triumph Strasbourg', ville: 'Strasbourg', notes: 'Triumph Moto Grand Est' },
    { entreprise: 'Triumph Grenoble', ville: 'Grenoble', notes: 'Triumph Moto Alpes' },
    { entreprise: 'Triumph Rennes', ville: 'Rennes', notes: 'Triumph Moto Bretagne' },
    { entreprise: 'Triumph Nantes', ville: 'Nantes', notes: 'Triumph Moto Pays de Loire' },

    // ══════ HARLEY-DAVIDSON ══════
    { entreprise: 'Harley-Davidson Paris', ville: 'Paris', notes: 'H-D Île-de-France' },
    { entreprise: 'Harley-Davidson Lyon', ville: 'Lyon', notes: 'H-D Auvergne-Rhône-Alpes' },
    { entreprise: 'Harley-Davidson Marseille', ville: 'Marseille', notes: 'H-D PACA' },
    { entreprise: 'Harley-Davidson Nice', ville: 'Nice', notes: 'H-D Côte d\'Azur' },
    { entreprise: 'Harley-Davidson Bordeaux', ville: 'Bordeaux', notes: 'H-D Nouvelle-Aquitaine' },
    { entreprise: 'Harley-Davidson Toulouse', ville: 'Toulouse', notes: 'H-D Occitanie' },
    { entreprise: 'Harley-Davidson Nantes', ville: 'Nantes', notes: 'H-D Pays de Loire' },
    { entreprise: 'Harley-Davidson Strasbourg', ville: 'Strasbourg', notes: 'H-D Grand Est' },
    { entreprise: 'Harley-Davidson Grenoble', ville: 'Grenoble', notes: 'H-D Alpes' },
    { entreprise: 'Harley-Davidson Rennes', ville: 'Rennes', notes: 'H-D Bretagne' },

    // ══════ KTM ══════
    { entreprise: 'KTM Paris', ville: 'Paris', notes: 'KTM Moto Île-de-France' },
    { entreprise: 'KTM Lyon', ville: 'Lyon', notes: 'KTM Moto Auvergne-Rhône-Alpes' },
    { entreprise: 'KTM Marseille', ville: 'Marseille', notes: 'KTM Moto PACA' },
    { entreprise: 'KTM Bordeaux', ville: 'Bordeaux', notes: 'KTM Moto Nouvelle-Aquitaine' },
    { entreprise: 'KTM Toulouse', ville: 'Toulouse', notes: 'KTM Moto Occitanie' },
    { entreprise: 'KTM Grenoble', ville: 'Grenoble', notes: 'KTM Moto Alpes' },
    { entreprise: 'KTM Strasbourg', ville: 'Strasbourg', notes: 'KTM Moto Grand Est' },

    // ══════ GROUPES NATIONAUX ══════
    { entreprise: 'Groupe Jean Lain Mobilités', ville: 'Bourg-en-Bresse', notes: 'Grand groupe distribution — Ain, Savoie, Isère, Rhône' },
    { entreprise: 'Groupe Chopard Automobiles', ville: 'Beaune', notes: 'Bourgogne — Renault, Dacia, BYD, MG, Hyundai, Kia' },
    { entreprise: 'Groupe Bernard Automobiles', ville: 'Lyon', notes: 'Rhône-Alpes — Volkswagen Group + multimarque' },
    { entreprise: 'Groupe Emil Frey France', ville: 'Paris', notes: 'N°1 distribution auto France — nationwide multimarque' },
    { entreprise: 'Groupe Dubreuil Automobiles', ville: 'La Roche-sur-Yon', notes: 'Vendée, Pays de Loire — multimarque' },
    { entreprise: 'Groupe Gueudet', ville: 'Compiègne', notes: 'Hauts-de-France — multimarque' },
    { entreprise: 'Groupe Bodemer', ville: 'Caen', notes: 'Normandie — multimarque' },
    { entreprise: 'Groupe LVO', ville: 'Rouen', notes: 'Normandie — multimarque' },
    { entreprise: 'Groupe Berto', ville: 'Caen', notes: 'Normandie — BMW, Mini, Peugeot' },
    { entreprise: 'Groupe Gemy', ville: 'Rennes', notes: 'Bretagne — multimarque' },
    { entreprise: 'Groupe Hénaff', ville: 'Brest', notes: 'Bretagne — multimarque' },
    { entreprise: 'Groupe Pelletier', ville: 'Strasbourg', notes: 'Alsace — multimarque' },
    { entreprise: 'Groupe Sofida', ville: 'Clermont-Ferrand', notes: 'Auvergne — multimarque' },
    { entreprise: 'Groupe Roca', ville: 'Paris', notes: 'Île-de-France — multimarque' },
    { entreprise: 'Groupe ABCIS', ville: 'Paris', notes: 'Île-de-France — multimarque' },
    { entreprise: 'Groupe Cobredia', ville: 'Brest', notes: 'Finistère — multimarque' },
    { entreprise: 'Groupe Autodis', ville: 'Paris', notes: 'Distribution pièces & service' },
    { entreprise: 'Groupe Mer & Lune', ville: 'Nice', notes: 'PACA — multimarque premium' },
    { entreprise: 'Groupe Leclercq', ville: 'Lille', notes: 'Hauts-de-France — multimarque' },
    { entreprise: 'Groupe Maurin', ville: 'Montpellier', notes: 'Occitanie — multimarque' },
    { entreprise: 'Groupe Tressol-Chabrier', ville: 'Perpignan', notes: 'Occitanie — multimarque' },
    { entreprise: 'Groupe Rey', ville: 'Grenoble', notes: 'Isère, Savoie — multimarque' },
    { entreprise: 'Groupe Sonauto', ville: 'Paris', notes: 'IDF — Porsche, Lamborghini importer historique' },
    { entreprise: 'Groupe Gattaz', ville: 'Grenoble', notes: 'Alpes — multimarque' },
    { entreprise: 'Groupe Delorme', ville: 'Lyon', notes: 'Rhône — multimarque' },
  ]

  let concNatCount = 0
  for (const c of concessionsNationales) {
    const ex = queryOne('SELECT id FROM ContactPro WHERE entreprise=?', [c.entreprise])
    if (!ex) {
      run('INSERT INTO ContactPro (nom,prenom,entreprise,ville,telephone,email,notes,updatedAt) VALUES (?,?,?,?,?,?,?,datetime("now"))',
        ['', '', c.entreprise, c.ville || '', '', '', c.notes || ''])
      concNatCount++
    }
  }
  console.log(`  ✓ ${concNatCount} concessions nationales ajoutées`)

  // ─────────────────────────────────────────────────────────────────────────
  // 3. IMPORT EXCEL — Clients & Dossiers
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Import des clients & dossiers depuis l\'Excel...')

  const XLSX = require(path.join(__dirname, '..', 'node_modules', 'xlsx'))
  const wb = XLSX.readFile(EXCEL_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, cellDates: true })

  let clientsCreated = 0
  let dossiersCreated = 0
  let skipped = 0

  // Map concession name (Excel) -> ContactPro.id
  function findConcession(nomExcel) {
    if (!nomExcel || !nomExcel.trim()) return null
    const n = nomExcel.trim().toUpperCase()

    // Correspondances directes
    const mapping = {
      'LOCALEASE': 'Localease',
      'MARC NICE': 'Marc Auto Nice (Cupra/VW/Skoda/Audi)',
      'MARC': 'Marc Auto Nice (Cupra/VW/Skoda/Audi)',
      'JEAN LAIN': 'Jean Lain Automobiles',
      'JEAN LAIN ': 'Jean Lain Automobiles',
      'RENAULT MEIGMAN': 'Renault Meigman',
      'AUDI SUMA VICHY': 'Audi Suma Vichy',
      'BYD LYON': 'BYD Lyon',
      'BMW ROYAL SA': 'BMW Royal SA',
      'HYUNDAI MONTARGIS': 'Hyundai Montargis',
      'AUDI MARC': 'Audi Marc Auto Nice (Cupra/VW/Skoda/Audi)',
      'FORD DIJON': 'Ford Dijon',
      'TRIUMPH AMIEN': 'Triumph Amiens',
      'AUDI BREST': 'Audi Brest',
      'ALEXIS HYUNDAI': 'Hyundai Alexis',
      'HYUNDAI ALEXIS': 'Hyundai Alexis',
      'MERCEDES LYON': 'Mercedes-Benz Lyon',
      'MERCEDES LYON ': 'Mercedes-Benz Lyon',
      'GTA 38 ARTHUR': 'GTA 38 Arthur',
      'BPM ORLEANS': 'BPM Orléans',
      'MORGAN JL': 'Morgan Jean Lain',
      'TOYOTA GIEN': 'Toyota Gien',
      'PORSCHE STRASBOURG': 'Porsche Strasbourg',
      'CITROEN ANNEMASSE': 'Citroën Annemasse',
      'IVECO AUXERRE': 'Iveco Auxerre',
      'LECAT': 'Lecat Automobiles',
      'LABEL AUTO': 'Label Auto',
      'LOWCAZ SASSENAGE': 'Lowcaz Sassenage',
      'AUDI CHAMBERY': 'Audi Chambéry',
      'ERIC CHOPARD': 'Eric Chopard Automobiles',
      'MAX MG': 'Max MG Automobiles',
      'ANTOINE ADENOT': 'Antoine Adenot Automobiles',
      'BYD ERIC': 'BYD Eric',
      'JL BEN LACASSIN': 'Jean Lain Ben Lacassin',
      'JL MAXENCE': 'Jean Lain Maxence',
      'YANNICK': 'Yannick Automobiles',
      'ANTHONY': 'Anthony Auto',
    }

    const key = n.trim()
    if (mapping[key]) {
      const cp = queryOne('SELECT id FROM ContactPro WHERE entreprise=?', [mapping[key]])
      return cp?.id || null
    }

    // Recherche approximative
    const cp = queryOne('SELECT id FROM ContactPro WHERE UPPER(entreprise) LIKE ?', [`%${key}%`])
    return cp?.id || null
  }

  function mapFinancement(val) {
    if (!val) return 'LLD'
    const v = String(val).trim().toUpperCase()
    if (v.includes('CASH') || v.includes('CDB')) return 'CASH'
    if (v.includes('LOA')) return 'LOA'
    if (v.includes('LLD')) return 'LLD'
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

  function mapNeufOccasion(val) {
    if (!val) return null
    const v = String(val).trim().toUpperCase()
    if (v.includes('VO') || v.includes('OCCASION')) return 'OCCASION'
    if (v.includes('VN') || v.includes('NEUF') || v.includes('VD')) return 'NEUF'
    return null
  }

  function mapType(val) {
    if (!val) return 'PARTICULIER'
    const v = String(val).trim().toUpperCase()
    if (v.includes('PRO')) return 'PROFESSIONNEL'
    return 'PARTICULIER'
  }

  // Dates de livraison (format textuel dans l'Excel)
  function parseLivraisonTextuelle(str) {
    // Déjà une date parseable
    const d = parseDate(str)
    if (d) return d
    // Textes du genre "LIVRE", "FEVRIER 2025", "MARS", "STOCK", "AOUT"...
    // On ne peut pas les convertir en date exacte sans année
    return null
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const nomPrenom = clean(row[1])
    if (!nomPrenom) { skipped++; continue }

    // Split nom/prénom (format "PRENOM NOM" ou "NOM PRENOM")
    const parts = nomPrenom.split(' ').filter(p => p.length > 0)
    let nom = parts[0] || 'INCONNU'
    let prenom = parts.slice(1).join(' ')
    // Si tout en majuscule, on garde tel quel
    if (!prenom && parts.length === 1) {
      nom = parts[0]
      prenom = ''
    }

    // Chercher client existant
    let clientId
    const existing = queryOne(
      'SELECT id FROM Client WHERE UPPER(nom)=UPPER(?) AND UPPER(prenom)=UPPER(?)',
      [nom, prenom]
    )

    if (existing) {
      clientId = existing.id
    } else {
      run(`INSERT INTO Client (nom,prenom,type,estPremierAppelant,updatedAt,createdAt) VALUES (?,?,?,?,datetime("now"),datetime("now"))`,
        [nom, prenom, mapType(row[2]), 1])
      clientId = lastId()
      clientsCreated++
    }

    // Données dossier
    const dateDemande = parseDate(row[0]) || new Date().toISOString()
    const typeFinancement = mapFinancement(row[3])
    const marqueNom = clean(row[5])
    const modeleNom = clean(row[6])
    const caracteristiques = clean(row[7])
    const loyerOuPrix = parsePrice(row[8])
    const apport = parsePrice(row[9])
    const repriseOuiNon = (String(row[10] || '').toUpperCase().includes('OUI') || String(row[10] || '').toUpperCase() === 'O') ? 1 : 0
    const repriseInfo = clean(row[11])
    const valeurReprise = parsePrice(row[12])
    const dureeKm = clean(row[13]) // ex: "36/45000 KM"
    const estChaud = bool(row[14])
    const concessionNom = clean(row[15])
    const commandeEffectuee = bool(row[16])
    const dateLivraisonRaw = clean(row[17])
    const factureOuiNon = String(row[18] || '').trim()
    const payeOuiNon = String(row[19] || '').trim()
    const dateRelanceRaw = clean(row[20])
    const montantCommission = parsePrice(row[21])
    const avisGoogle = bool(row[22])

    // Parser durée/km
    let dureeContrat = null
    let kilometrageContrat = null
    if (dureeKm) {
      const m = dureeKm.match(/(\d+)\s*[\/]\s*(\d+)/)
      if (m) {
        dureeContrat = parseInt(m[1])
        kilometrageContrat = parseInt(m[2])
      }
    }

    // Contact pro
    const contactProId = findConcession(concessionNom)

    // Statut
    const statut = mapStatut(row[16], row[18], row[19])
    const statutCommission = mapCommissionStatut(row[18], row[19])
    const dateRelance = parseDate(dateRelanceRaw)

    // Valeur véhicule (pour CASH c'est le prix, pour LOA/LLD c'est le loyer)
    let valeurVehicule = null
    let loyerMensuel = null
    if (typeFinancement === 'CASH') {
      valeurVehicule = loyerOuPrix
    } else {
      loyerMensuel = loyerOuPrix
    }

    // Type véhicule (heuristique sur la marque)
    const motoMarques = ['HONDA CB', 'TRIUMPH', 'DUCATI', 'BMW MOTO', 'KTM', 'KAWASAKI', 'YAMAHA', 'SUZUKI MOTO', 'HARLEY']
    const typeVehicule = motoMarques.some(m => marqueNom.toUpperCase().includes(m)) ? 'MOTO' : 'VOITURE'

    // Neuf ou occasion
    const neufOuOccasion = mapNeufOccasion(row[4])

    // Génération numéro
    const numero = generateNumero()

    try {
      run(`INSERT INTO Dossier (
        numeroDossier,clientId,dateDemande,typeFinancement,statut,
        typeVehicule,marqueNom,modeleNom,energie,neufOuOccasion,caracteristiques,
        valeurVehicule,loyerMensuel,premierLoyerMajore,dureeContrat,kilometrageContrat,apport,
        repriseOuiNon,repriseMarque,repriseModele,repriseValeur,repriseEtat,
        contactProId,nomVendeur,lieuPriseCommande,dateCommande,commandeEffectuee,
        dateLivraisonPrevue,dateLivraisonReelle,statutLivraison,
        montantCommission,statutCommission,dateFacturation,datePaiement,dateRelance,
        estChaud,notes,updatedAt,createdAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime("now"),datetime("now"))`,
        [
          numero, clientId, dateDemande, typeFinancement, statut,
          typeVehicule, marqueNom || null, modeleNom || null, null, neufOuOccasion, caracteristiques || null,
          valeurVehicule, loyerMensuel, null, dureeContrat, kilometrageContrat, apport,
          repriseOuiNon,
          repriseInfo ? repriseInfo.split(' ')[0] || null : null,
          repriseInfo ? repriseInfo.split(' ').slice(1).join(' ') || null : null,
          valeurReprise, null,
          contactProId, null, null, null, commandeEffectuee,
          null, null, null,
          montantCommission, statutCommission, null, null, dateRelance,
          estChaud, null,
        ]
      )

      // Mettre à jour avis google sur le client si coché
      if (avisGoogle) {
        run('UPDATE Client SET avisGoogle=1 WHERE id=?', [clientId])
      }

      dossiersCreated++
    } catch (e) {
      console.log(`  ⚠ Ligne ${i+1} (${nomPrenom}): ${e.message}`)
      skipped++
    }
  }

  console.log(`  ✓ ${clientsCreated} clients créés`)
  console.log(`  ✓ ${dossiersCreated} dossiers importés`)
  if (skipped > 0) console.log(`  ⚠ ${skipped} lignes ignorées (vides ou erreur)`)

  // ─────────────────────────────────────────────────────────────────────────
  // Sauvegarde finale
  // ─────────────────────────────────────────────────────────────────────────
  saveDb()
  console.log('\n✅ Import terminé ! Base de données sauvegardée.')
  console.log(`   Chemin : ${DB_PATH}`)

  const stats = queryOne('SELECT (SELECT COUNT(*) FROM Client) as clients, (SELECT COUNT(*) FROM Dossier) as dossiers, (SELECT COUNT(*) FROM ContactPro) as concessions')
  console.log(`\n📊 Récap base :`)
  console.log(`   - Clients     : ${stats?.clients}`)
  console.log(`   - Dossiers    : ${stats?.dossiers}`)
  console.log(`   - Concessions : ${stats?.concessions}`)
}

main().catch(e => { console.error('ERREUR:', e); process.exit(1) })
