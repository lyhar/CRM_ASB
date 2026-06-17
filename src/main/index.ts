import { app, BrowserWindow, ipcMain, shell, dialog, session } from 'electron'
import { join, dirname } from 'path'
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, cpSync, readdirSync, statSync, unlinkSync } from 'fs'
import { autoUpdater } from 'electron-updater'
import type { Database } from 'sql.js'

let db: Database
let mainWindow: BrowserWindow

function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update:available', {
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update:not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update:downloaded')
  })

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update:error', err.message)
  })

  ipcMain.handle('update:check', async () => {
    try { await autoUpdater.checkForUpdates() } catch {}
  })
  ipcMain.handle('update:download', async () => {
    try { await autoUpdater.downloadUpdate() } catch {}
  })
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall()
  })
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    appPath: app.isPackaged ? dirname(app.getPath('exe')) : app.getAppPath(),
    dataDir: getDataDir(),
    dbPath: getDbPath(),
    documentsDir: getDocumentsDir(),
    backupsDir: getBackupDir(),
    electron: process.versions.electron,
    node: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    packaged: app.isPackaged,
  }))
}

// Dossier de données : à côté de l'exe en prod, ou 'dev-data' en dev
function getDataDir(): string {
  const dir = app.isPackaged
    ? join(dirname(app.getPath('exe')), 'data')
    : join(app.getAppPath(), 'dev-data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

// Migration : déplace les données des anciens emplacements AppData vers le dossier de l'app
function migrateToNewDataDir(): void {
  const dataDir = getDataDir()
  if (existsSync(join(dataDir, 'crm.db'))) return // déjà migré

  const candidates = [
    join(app.getPath('appData'), 'autolead-crm'),
    join(app.getPath('appData'), 'asb-crm'),
  ]
  for (const src of candidates) {
    if (existsSync(join(src, 'crm.db'))) {
      try { cpSync(src, dataDir, { recursive: true }) } catch (e) { console.error('Migration failed:', e) }
      break
    }
  }
}

function getDbPath(): string {
  return join(getDataDir(), 'crm.db')
}

function getDocumentsDir(): string {
  const dir = join(getDataDir(), 'documents')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function saveDb(): void {
  const data = db.export()
  writeFileSync(getDbPath(), Buffer.from(data))
}

function run(sql: string, params: any[] = []): void {
  db.run(sql, params)
  saveDb()
}

function query<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows: T[] = []
  while (stmt.step()) {
    const row: any = {}
    const cols = stmt.getColumnNames()
    const vals = stmt.get()
    cols.forEach((c, i) => { row[c] = vals[i] })
    rows.push(row)
  }
  stmt.free()
  return rows
}

function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = query<T>(sql, params)
  return rows.length > 0 ? rows[0] : null
}

function lastInsertId(): number {
  const r = query<{ id: number }>('SELECT last_insert_rowid() as id')
  return r[0]?.id ?? 0
}

async function initDatabase(): Promise<void> {
  const initSqlJs = require('sql.js')
  let wasmPath = join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  if (!existsSync(wasmPath)) {
    wasmPath = join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  }
  const SQL = await initSqlJs({ locateFile: () => wasmPath })
  const dbPath = getDbPath()
  if (existsSync(dbPath)) {
    backupDatabase() // sauvegarde automatique avant toute migration
    db = new SQL.Database(readFileSync(dbPath))
  } else {
    db = new SQL.Database()
  }
  createTables()
  migrateSchema()
  seedInitialData()
}

function migrateSchema(): void {
  try { db.run('ALTER TABLE Client ADD COLUMN entreprise TEXT') } catch {}
}

function createTables(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'AGENT',
      actif INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS Client (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'PARTICULIER',
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      entreprise TEXT,
      dateNaissance TEXT,
      adresse TEXT,
      codePostal TEXT,
      ville TEXT,
      telephone TEXT,
      email TEXT,
      estPremierAppelant INTEGER NOT NULL DEFAULT 1,
      referentId INTEGER,
      nombreContactsAmenes INTEGER NOT NULL DEFAULT 0,
      avisGoogle INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdById INTEGER,
      FOREIGN KEY (referentId) REFERENCES Client(id),
      FOREIGN KEY (createdById) REFERENCES User(id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS ContactPro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT,
      entreprise TEXT NOT NULL,
      adresse TEXT,
      codePostal TEXT,
      ville TEXT,
      telephone TEXT,
      email TEXT,
      siret TEXT,
      notes TEXT,
      actif INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS Marque (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      actif INTEGER NOT NULL DEFAULT 1
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS Modele (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      marqueId INTEGER NOT NULL,
      actif INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (marqueId) REFERENCES Marque(id),
      UNIQUE(marqueId, nom)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS Dossier (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numeroDossier TEXT NOT NULL UNIQUE,
      clientId INTEGER NOT NULL,
      dateDemande TEXT NOT NULL DEFAULT (datetime('now')),
      typeFinancement TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'OUVERT',
      typeVehicule TEXT,
      marqueNom TEXT,
      modeleNom TEXT,
      energie TEXT,
      neufOuOccasion TEXT,
      caracteristiques TEXT,
      valeurVehicule REAL,
      loyerMensuel REAL,
      premierLoyerMajore REAL,
      dureeContrat INTEGER,
      kilometrageContrat INTEGER,
      apport REAL,
      repriseOuiNon INTEGER NOT NULL DEFAULT 0,
      repriseMarque TEXT,
      repriseModele TEXT,
      repriseValeur REAL,
      repriseEtat TEXT,
      contactProId INTEGER,
      nomVendeur TEXT,
      lieuPriseCommande TEXT,
      dateCommande TEXT,
      commandeEffectuee INTEGER NOT NULL DEFAULT 0,
      dateLivraisonPrevue TEXT,
      dateLivraisonReelle TEXT,
      statutLivraison TEXT,
      montantCommission REAL,
      statutCommission TEXT,
      dateFacturation TEXT,
      datePaiement TEXT,
      dateRelance TEXT,
      estChaud INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdById INTEGER,
      FOREIGN KEY (clientId) REFERENCES Client(id),
      FOREIGN KEY (contactProId) REFERENCES ContactPro(id),
      FOREIGN KEY (createdById) REFERENCES User(id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS Document (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dossierId INTEGER,
      clientId INTEGER,
      typeDocument TEXT NOT NULL,
      nomFichier TEXT NOT NULL,
      cheminFichier TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (dossierId) REFERENCES Dossier(id),
      FOREIGN KEY (clientId) REFERENCES Client(id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS Relance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dossierId INTEGER NOT NULL,
      dateRelance TEXT NOT NULL,
      notes TEXT,
      effectuee INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (dossierId) REFERENCES Dossier(id)
    )
  `)
  db.run(`
    CREATE TABLE IF NOT EXISTS Settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)
  saveDb()
}

function seedInitialData(): void {
  const seedBasePaths = [
    join(process.resourcesPath, 'seeds'),
    join(app.getAppPath(), 'context', 'seeds'),
    join(__dirname, '..', '..', '..', 'context', 'seeds'),
    'D:\\projet\\Antoine\\CRM\\context\\seeds'
  ]

  function findSeedFile(filename: string): string | null {
    for (const base of seedBasePaths) {
      const p = join(base, filename)
      if (existsSync(p)) return p
    }
    return null
  }

  // 1. Seed marques/modèles si vide
  const marqueCount = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM Marque')
  if ((marqueCount?.c ?? 0) === 0) {
    const p = findSeedFile('marques_modeles.json')
    if (p) {
      try {
        const seedData: { marque: string; type: string; modeles: string[] }[] = JSON.parse(readFileSync(p, 'utf-8'))
        for (const item of seedData) {
          db.run('INSERT OR IGNORE INTO Marque (nom, type) VALUES (?, ?)', [item.marque, item.type === 'voiture' ? 'VOITURE' : 'MOTO'])
          const marque = queryOne<{ id: number }>('SELECT id FROM Marque WHERE nom = ?', [item.marque])
          if (marque) {
            for (const modele of item.modeles) {
              db.run('INSERT OR IGNORE INTO Modele (nom, marqueId) VALUES (?, ?)', [modele, marque.id])
            }
          }
        }
      } catch {}
    }
  }

  // 2. Créer l'utilisateur admin si aucun utilisateur
  const userCount = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM User')
  if ((userCount?.c ?? 0) === 0) {
    run(`INSERT INTO User (nom, prenom, email, role) VALUES ('Moreau', 'Antoine', 'admin@asb.fr', 'ADMIN')`)
  }

  saveDb()
}

function generateNumeroDossier(): string {
  const year = new Date().getFullYear()
  const prefix = queryOne<{ value: string }>(`SELECT value FROM Settings WHERE key='dossier_prefix'`)?.value || 'AL'
  const r = queryOne<{ max: string | null }>(`SELECT MAX(numeroDossier) as max FROM Dossier WHERE numeroDossier LIKE ?`, [`${prefix}-${year}-%`])
  const lastNum = r?.max ? parseInt(r.max.split('-').pop() || '0') : 0
  return `${prefix}-${year}-${String(lastNum + 1).padStart(4, '0')}`
}

function getBackupDir(): string {
  const dir = join(getDataDir(), 'backups')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function backupDatabase(): void {
  try {
    const dbPath = getDbPath()
    if (!existsSync(dbPath)) return
    const backupDir = getBackupDir()
    const ts = new Date().toISOString().replace(/T/, '_').replace(/:/g, 'h').replace(/\..+/, '').replace(/(\d{2})h(\d{2})h/, '$1h$2m')
    copyFileSync(dbPath, join(backupDir, `crm_${ts}.db`))
    // Garder seulement les 10 derniers backups
    const files = readdirSync(backupDir).filter(f => f.startsWith('crm_') && f.endsWith('.db')).sort()
    if (files.length > 10) {
      files.slice(0, files.length - 10).forEach(f => { try { unlinkSync(join(backupDir, f)) } catch {} })
    }
  } catch (e) { console.error('Auto-backup failed:', e) }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#141414', symbolColor: '#e5e5e5', height: 36 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })
  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function ok(data?: any) { return { success: true, data } }
function err(e: unknown) { return { success: false, error: String(e) } }

function registerIpcHandlers(): void {
  // USERS
  ipcMain.handle('users:getAll', () => { try { return ok(query('SELECT * FROM User ORDER BY nom')) } catch (e) { return err(e) } })
  ipcMain.handle('users:create', (_, d) => { try { run('INSERT INTO User (nom, prenom, email, role) VALUES (?,?,?,?)', [d.nom, d.prenom, d.email, d.role || 'AGENT']); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('users:update', (_, id, d) => { try { run('UPDATE User SET nom=?,prenom=?,email=?,role=?,actif=? WHERE id=?', [d.nom, d.prenom, d.email, d.role, d.actif ? 1 : 0, id]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('users:delete', (_, id) => { try { run('DELETE FROM User WHERE id=?', [id]); return ok() } catch (e) { return err(e) } })

  // CLIENTS
  ipcMain.handle('clients:getAll', (_, f) => {
    try {
      let q = `SELECT c.*, r.nom as referentNom, r.prenom as referentPrenom, (SELECT COUNT(*) FROM Dossier WHERE clientId=c.id) as nbDossiers FROM Client c LEFT JOIN Client r ON r.id=c.referentId WHERE 1=1`
      const p: any[] = []
      if (f?.search) { q += ` AND (c.nom LIKE ? OR c.prenom LIKE ? OR c.telephone LIKE ? OR c.email LIKE ?)`; const s = `%${f.search}%`; p.push(s,s,s,s) }
      if (f?.type) { q += ` AND c.type=?`; p.push(f.type) }
      q += ` ORDER BY c.createdAt DESC`
      return ok(query(q, p))
    } catch (e) { return err(e) }
  })
  ipcMain.handle('clients:getOne', (_, id) => {
    try {
      const c = queryOne('SELECT c.*, r.nom as referentNom, r.prenom as referentPrenom FROM Client c LEFT JOIN Client r ON r.id=c.referentId WHERE c.id=?', [id])
      if (!c) return err('Introuvable')
      const dossiers = query('SELECT d.*, cp.entreprise as concessionnaire FROM Dossier d LEFT JOIN ContactPro cp ON cp.id=d.contactProId WHERE d.clientId=? ORDER BY d.createdAt DESC', [id])
      const documents = query('SELECT * FROM Document WHERE clientId=?', [id])
      return ok({ ...c, dossiers, documents })
    } catch (e) { return err(e) }
  })
  ipcMain.handle('clients:create', (_, d) => {
    try {
      run('INSERT INTO Client (type,nom,prenom,dateNaissance,adresse,codePostal,ville,telephone,email,estPremierAppelant,referentId,nombreContactsAmenes,avisGoogle,notes,createdById,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime("now"))',
        [d.type||'PARTICULIER',d.nom,d.prenom,d.dateNaissance||null,d.adresse||null,d.codePostal||null,d.ville||null,d.telephone||null,d.email||null,d.estPremierAppelant?1:0,d.referentId||null,d.nombreContactsAmenes||0,d.avisGoogle?1:0,d.notes||null,d.createdById||null])
      return ok(queryOne('SELECT * FROM Client WHERE id=?', [lastInsertId()]))
    } catch (e) { return err(e) }
  })
  ipcMain.handle('clients:update', (_, id, d) => {
    try {
      run('UPDATE Client SET type=?,nom=?,prenom=?,dateNaissance=?,adresse=?,codePostal=?,ville=?,telephone=?,email=?,estPremierAppelant=?,referentId=?,nombreContactsAmenes=?,avisGoogle=?,notes=?,updatedAt=datetime("now") WHERE id=?',
        [d.type,d.nom,d.prenom,d.dateNaissance||null,d.adresse||null,d.codePostal||null,d.ville||null,d.telephone||null,d.email||null,d.estPremierAppelant?1:0,d.referentId||null,d.nombreContactsAmenes||0,d.avisGoogle?1:0,d.notes||null,id])
      return ok()
    } catch (e) { return err(e) }
  })
  ipcMain.handle('clients:delete', (_, id) => { try { run('DELETE FROM Client WHERE id=?', [id]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('clients:search', (_, q) => {
    try {
      const s = `%${q}%`
      return ok(query('SELECT id,nom,prenom,telephone,email,type FROM Client WHERE nom LIKE ? OR prenom LIKE ? OR telephone LIKE ? LIMIT 10', [s,s,s]))
    } catch (e) { return err(e) }
  })

  // DOSSIERS
  ipcMain.handle('dossiers:getNextNumero', () => { try { return ok(generateNumeroDossier()) } catch (e) { return err(e) } })
  ipcMain.handle('dossiers:getAll', (_, f) => {
    try {
      let q = `SELECT d.*,c.nom as clientNom,c.prenom as clientPrenom,c.telephone as clientTel,cp.entreprise as concessionnaire,u.nom as agentNom,u.prenom as agentPrenom FROM Dossier d LEFT JOIN Client c ON c.id=d.clientId LEFT JOIN ContactPro cp ON cp.id=d.contactProId LEFT JOIN User u ON u.id=d.createdById WHERE 1=1`
      const p: any[] = []
      if (f?.statut) { q += ` AND d.statut=?`; p.push(f.statut) }
      if (f?.typeFinancement) { q += ` AND d.typeFinancement=?`; p.push(f.typeFinancement) }
      if (f?.statutCommission) { q += ` AND d.statutCommission=?`; p.push(f.statutCommission) }
      if (f?.search) { q += ` AND (c.nom LIKE ? OR c.prenom LIKE ? OR d.numeroDossier LIKE ? OR d.marqueNom LIKE ?)`; const s=`%${f.search}%`; p.push(s,s,s,s) }
      if (f?.clientId) { q += ` AND d.clientId=?`; p.push(f.clientId) }
      if (f?.contactProId) { q += ` AND d.contactProId=?`; p.push(f.contactProId) }
      q += ` ORDER BY d.createdAt DESC`
      if (f?.limit) { q += ` LIMIT ?`; p.push(f.limit) }
      return ok(query(q, p))
    } catch (e) { return err(e) }
  })
  ipcMain.handle('dossiers:getOne', (_, id) => {
    try {
      const d = queryOne('SELECT d.*,c.nom as clientNom,c.prenom as clientPrenom,c.telephone as clientTel,c.email as clientEmail,cp.entreprise as concessionnaire,cp.nom as contactProNom,cp.telephone as contactProTel,u.nom as agentNom,u.prenom as agentPrenom FROM Dossier d LEFT JOIN Client c ON c.id=d.clientId LEFT JOIN ContactPro cp ON cp.id=d.contactProId LEFT JOIN User u ON u.id=d.createdById WHERE d.id=?', [id])
      if (!d) return err('Introuvable')
      const documents = query('SELECT * FROM Document WHERE dossierId=?', [id])
      const relances = query('SELECT * FROM Relance WHERE dossierId=? ORDER BY dateRelance', [id])
      return ok({ ...d, documents, relances })
    } catch (e) { return err(e) }
  })
  ipcMain.handle('dossiers:create', (_, d) => {
    try {
      const numero = generateNumeroDossier()
      run(`INSERT INTO Dossier (numeroDossier,clientId,dateDemande,typeFinancement,statut,typeVehicule,marqueNom,modeleNom,energie,neufOuOccasion,caracteristiques,valeurVehicule,loyerMensuel,premierLoyerMajore,dureeContrat,kilometrageContrat,apport,repriseOuiNon,repriseMarque,repriseModele,repriseValeur,repriseEtat,contactProId,nomVendeur,lieuPriseCommande,dateCommande,commandeEffectuee,dateLivraisonPrevue,dateLivraisonReelle,statutLivraison,montantCommission,statutCommission,dateFacturation,datePaiement,dateRelance,estChaud,notes,createdById,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime("now"))`,
        [numero,d.clientId,d.dateDemande||new Date().toISOString(),d.typeFinancement,d.statut||'OUVERT',d.typeVehicule||null,d.marqueNom||null,d.modeleNom||null,d.energie||null,d.neufOuOccasion||null,d.caracteristiques||null,d.valeurVehicule||null,d.loyerMensuel||null,d.premierLoyerMajore||null,d.dureeContrat||null,d.kilometrageContrat||null,d.apport||null,d.repriseOuiNon?1:0,d.repriseMarque||null,d.repriseModele||null,d.repriseValeur||null,d.repriseEtat||null,d.contactProId||null,d.nomVendeur||null,d.lieuPriseCommande||null,d.dateCommande||null,d.commandeEffectuee?1:0,d.dateLivraisonPrevue||null,d.dateLivraisonReelle||null,d.statutLivraison||null,d.montantCommission||null,d.statutCommission||null,d.dateFacturation||null,d.datePaiement||null,d.dateRelance||null,d.estChaud?1:0,d.notes||null,d.createdById||null])
      return ok(queryOne('SELECT * FROM Dossier WHERE numeroDossier=?', [numero]))
    } catch (e) { return err(e) }
  })
  ipcMain.handle('dossiers:update', (_, id, d) => {
    try {
      run(`UPDATE Dossier SET typeFinancement=?,statut=?,typeVehicule=?,marqueNom=?,modeleNom=?,energie=?,neufOuOccasion=?,caracteristiques=?,valeurVehicule=?,loyerMensuel=?,premierLoyerMajore=?,dureeContrat=?,kilometrageContrat=?,apport=?,repriseOuiNon=?,repriseMarque=?,repriseModele=?,repriseValeur=?,repriseEtat=?,contactProId=?,nomVendeur=?,lieuPriseCommande=?,dateCommande=?,commandeEffectuee=?,dateLivraisonPrevue=?,dateLivraisonReelle=?,statutLivraison=?,montantCommission=?,statutCommission=?,dateFacturation=?,datePaiement=?,dateRelance=?,estChaud=?,notes=?,updatedAt=datetime("now") WHERE id=?`,
        [d.typeFinancement,d.statut,d.typeVehicule||null,d.marqueNom||null,d.modeleNom||null,d.energie||null,d.neufOuOccasion||null,d.caracteristiques||null,d.valeurVehicule||null,d.loyerMensuel||null,d.premierLoyerMajore||null,d.dureeContrat||null,d.kilometrageContrat||null,d.apport||null,d.repriseOuiNon?1:0,d.repriseMarque||null,d.repriseModele||null,d.repriseValeur||null,d.repriseEtat||null,d.contactProId||null,d.nomVendeur||null,d.lieuPriseCommande||null,d.dateCommande||null,d.commandeEffectuee?1:0,d.dateLivraisonPrevue||null,d.dateLivraisonReelle||null,d.statutLivraison||null,d.montantCommission||null,d.statutCommission||null,d.dateFacturation||null,d.datePaiement||null,d.dateRelance||null,d.estChaud?1:0,d.notes||null,id])
      return ok()
    } catch (e) { return err(e) }
  })
  ipcMain.handle('dossiers:delete', (_, id) => {
    try {
      run('DELETE FROM Relance WHERE dossierId=?', [id])
      run('DELETE FROM Document WHERE dossierId=?', [id])
      run('DELETE FROM Dossier WHERE id=?', [id])
      return ok()
    } catch (e) { return err(e) }
  })

  // CONTACTS PRO
  ipcMain.handle('contactsPro:getAll', (_, f) => {
    try {
      let q = `SELECT cp.*,COUNT(d.id) as nbDossiers,COALESCE(SUM(CASE WHEN d.statutCommission IS NOT NULL THEN d.montantCommission ELSE 0 END),0) as totalCommissions FROM ContactPro cp LEFT JOIN Dossier d ON d.contactProId=cp.id WHERE 1=1`
      const p: any[] = []
      if (f?.search) { q += ` AND (cp.entreprise LIKE ? OR cp.nom LIKE ? OR cp.ville LIKE ?)`; const s=`%${f.search}%`; p.push(s,s,s) }
      q += ` GROUP BY cp.id ORDER BY nbDossiers DESC, cp.entreprise`
      return ok(query(q, p))
    } catch (e) { return err(e) }
  })
  ipcMain.handle('contactsPro:getOne', (_, id) => {
    try {
      const c = queryOne('SELECT * FROM ContactPro WHERE id=?', [id])
      const dossiers = query('SELECT d.*,c.nom as clientNom,c.prenom as clientPrenom FROM Dossier d LEFT JOIN Client c ON c.id=d.clientId WHERE d.contactProId=? ORDER BY d.createdAt DESC', [id])
      return ok({ ...c, dossiers })
    } catch (e) { return err(e) }
  })
  ipcMain.handle('contactsPro:create', (_, d) => {
    try {
      run('INSERT INTO ContactPro (nom,prenom,entreprise,adresse,codePostal,ville,telephone,email,siret,notes,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,datetime("now"))',
        [d.nom,d.prenom||null,d.entreprise,d.adresse||null,d.codePostal||null,d.ville||null,d.telephone||null,d.email||null,d.siret||null,d.notes||null])
      return ok(queryOne('SELECT * FROM ContactPro WHERE id=?', [lastInsertId()]))
    } catch (e) { return err(e) }
  })
  ipcMain.handle('contactsPro:update', (_, id, d) => {
    try {
      run('UPDATE ContactPro SET nom=?,prenom=?,entreprise=?,adresse=?,codePostal=?,ville=?,telephone=?,email=?,siret=?,notes=?,actif=?,updatedAt=datetime("now") WHERE id=?',
        [d.nom,d.prenom||null,d.entreprise,d.adresse||null,d.codePostal||null,d.ville||null,d.telephone||null,d.email||null,d.siret||null,d.notes||null,d.actif?1:0,id])
      return ok()
    } catch (e) { return err(e) }
  })
  ipcMain.handle('contactsPro:delete', (_, id) => { try { run('DELETE FROM ContactPro WHERE id=?', [id]); return ok() } catch (e) { return err(e) } })

  // MARQUES
  ipcMain.handle('marques:getAll', (_, type) => {
    try {
      const q = type
        ? 'SELECT m.*,COUNT(mo.id) as nbModeles FROM Marque m LEFT JOIN Modele mo ON mo.marqueId=m.id WHERE m.type=? GROUP BY m.id ORDER BY m.nom'
        : 'SELECT m.*,COUNT(mo.id) as nbModeles FROM Marque m LEFT JOIN Modele mo ON mo.marqueId=m.id GROUP BY m.id ORDER BY m.type,m.nom'
      return ok(type ? query(q, [type]) : query(q))
    } catch (e) { return err(e) }
  })
  ipcMain.handle('marques:create', (_, d) => { try { run('INSERT INTO Marque (nom,type) VALUES (?,?)', [d.nom, d.type]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('marques:update', (_, id, d) => { try { run('UPDATE Marque SET nom=?,type=?,actif=? WHERE id=?', [d.nom, d.type, d.actif?1:0, id]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('marques:delete', (_, id) => { try { run('DELETE FROM Modele WHERE marqueId=?', [id]); run('DELETE FROM Marque WHERE id=?', [id]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('modeles:getAll', (_, marqueId) => { try { return ok(query('SELECT * FROM Modele WHERE marqueId=? ORDER BY nom', [marqueId])) } catch (e) { return err(e) } })
  ipcMain.handle('modeles:create', (_, d) => { try { run('INSERT OR IGNORE INTO Modele (nom,marqueId) VALUES (?,?)', [d.nom, d.marqueId]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('modeles:update', (_, id, d) => { try { run('UPDATE Modele SET nom=?,actif=? WHERE id=?', [d.nom, d.actif?1:0, id]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('modeles:delete', (_, id) => { try { run('DELETE FROM Modele WHERE id=?', [id]); return ok() } catch (e) { return err(e) } })

  // DOCUMENTS
  ipcMain.handle('documents:getAll', (_, f) => {
    try {
      let q = 'SELECT * FROM Document WHERE 1=1'
      const p: any[] = []
      if (f?.dossierId) { q += ` AND dossierId=?`; p.push(f.dossierId) }
      if (f?.clientId) { q += ` AND clientId=?`; p.push(f.clientId) }
      q += ` ORDER BY createdAt DESC`
      return ok(query(q, p))
    } catch (e) { return err(e) }
  })
  ipcMain.handle('documents:upload', (_, d) => {
    try {
      const destDir = getDocumentsDir()
      const filename = `${Date.now()}_${d.nomFichier}`
      const dest = join(destDir, filename)
      copyFileSync(d.sourcePath, dest)
      run('INSERT INTO Document (dossierId,clientId,typeDocument,nomFichier,cheminFichier) VALUES (?,?,?,?,?)',
        [d.dossierId||null, d.clientId||null, d.typeDocument, d.nomFichier, dest])
      return ok({ cheminFichier: dest })
    } catch (e) { return err(e) }
  })
  ipcMain.handle('documents:delete', (_, id) => { try { run('DELETE FROM Document WHERE id=?', [id]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('documents:open', async (_, chemin) => { try { await shell.openPath(chemin); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    try { await shell.openExternal(url); return ok() } catch (e) { return err(e) }
  })
  ipcMain.handle('dialog:confirm', async (_, message: string) => {
    const r = await dialog.showMessageBox(mainWindow, {
      type: 'question', buttons: ['Annuler', 'Confirmer'],
      defaultId: 1, cancelId: 0, message
    })
    mainWindow.focus()
    return ok(r.response === 1)
  })

  // RELANCES
  ipcMain.handle('relances:create', (_, d) => { try { run('INSERT INTO Relance (dossierId,dateRelance,notes) VALUES (?,?,?)', [d.dossierId, d.dateRelance, d.notes||null]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('relances:update', (_, id, d) => { try { run('UPDATE Relance SET effectuee=?,notes=? WHERE id=?', [d.effectuee?1:0, d.notes||null, id]); return ok() } catch (e) { return err(e) } })
  ipcMain.handle('relances:delete', (_, id) => { try { run('DELETE FROM Relance WHERE id=?', [id]); return ok() } catch (e) { return err(e) } })

  // DASHBOARD
  ipcMain.handle('dashboard:getStats', () => {
    try {
      const counts = queryOne<any>('SELECT SUM(CASE WHEN statut="OUVERT" THEN 1 ELSE 0 END) as dossiersOuverts,SUM(CASE WHEN statut="GAGNE" THEN 1 ELSE 0 END) as dossiersGagnes,SUM(CASE WHEN statut="PERDU" THEN 1 ELSE 0 END) as dossiersPerdus,SUM(CASE WHEN statut="EN_ATTENTE" THEN 1 ELSE 0 END) as dossiersEnAttente,COALESCE(SUM(montantCommission),0) as commissionsTotal,COALESCE(SUM(CASE WHEN statutCommission="PAYEE" THEN montantCommission ELSE 0 END),0) as commissionsPayees,COALESCE(SUM(CASE WHEN statutCommission="A_FACTURER" THEN montantCommission ELSE 0 END),0) as commissionsAFacturer,COALESCE(SUM(CASE WHEN statutCommission="FACTUREE" THEN montantCommission ELSE 0 END),0) as commissionsEnAttente FROM Dossier')
      const retard = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM Dossier WHERE statutLivraison="EN_RETARD" OR (dateLivraisonPrevue < datetime("now") AND (statutLivraison IS NULL OR statutLivraison NOT IN ("LIVREE","EN_AVANCE","A_L_HEURE")) AND dateLivraisonPrevue IS NOT NULL)')
      const commMois = query('SELECT strftime("%Y-%m",dateDemande) as mois,COALESCE(SUM(montantCommission),0) as montant FROM Dossier WHERE dateDemande >= datetime("now","-6 months") GROUP BY mois ORDER BY mois')
      const derniersDossiers = query('SELECT d.*,c.nom as clientNom,c.prenom as clientPrenom FROM Dossier d LEFT JOIN Client c ON c.id=d.clientId ORDER BY d.createdAt DESC LIMIT 10')
      const total = (counts?.dossiersGagnes||0)+(counts?.dossiersPerdus||0)
      const tauxConversion = total>0 ? Math.round(((counts?.dossiersGagnes||0)/total)*100) : 0
      return ok({ ...counts, tauxConversion, livraisonsEnRetard: retard?.count||0, commissionsMois: commMois, dernierssDossiers: derniersDossiers })
    } catch (e) { return err(e) }
  })

  // DIALOGS
  ipcMain.handle('dialog:openFile', async (_, opts) => {
    const r = await dialog.showOpenDialog(mainWindow, opts || { properties: ['openFile'] })
    return ok(r)
  })
  ipcMain.handle('dialog:openDocument', async () => {
    const r = await dialog.showOpenDialog(mainWindow, { title: 'Importer un document', properties: ['openFile'], filters: [{ name: 'Documents', extensions: ['pdf','jpg','jpeg','png','doc','docx','xls','xlsx'] },{ name: 'Tous', extensions: ['*'] }] })
    return ok(r)
  })

  // IMAGE
  ipcMain.handle('image:readAsBase64', async () => {
    try {
      const r = await dialog.showOpenDialog(mainWindow, {
        title: 'Choisir une image',
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] }]
      })
      if (r.canceled || !r.filePaths[0]) return ok(null)
      const data = readFileSync(r.filePaths[0])
      const ext = r.filePaths[0].split('.').pop()?.toLowerCase() || 'png'
      const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
      return ok(`data:${mime};base64,${data.toString('base64')}`)
    } catch (e) { return err(e) }
  })

  // SETTINGS
  ipcMain.handle('settings:getAll', () => {
    try {
      const rows = query<{ key: string; value: string }>('SELECT key, value FROM Settings')
      const s: Record<string, string> = {}
      rows.forEach(r => { s[r.key] = r.value })
      return ok(s)
    } catch (e) { return err(e) }
  })
  ipcMain.handle('settings:set', (_, key: string, value: string) => {
    try {
      run('INSERT INTO Settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [key, value])
      return ok()
    } catch (e) { return err(e) }
  })

  // EMAIL
  ipcMain.handle('email:send', async (_, { to, subject, html }: { to: string; subject: string; html: string }) => {
    try {
      const rows = query<{ key: string; value: string }>('SELECT key, value FROM Settings')
      const s: Record<string, string> = {}
      rows.forEach(r => { s[r.key] = r.value })
      if (!s.smtp_host || !s.smtp_user || !s.smtp_password) return err('SMTP non configuré. Allez dans Paramètres → Email.')
      const nodemailer = require('nodemailer')
      const transporter = nodemailer.createTransport({
        host: s.smtp_host,
        port: parseInt(s.smtp_port || '587'),
        secure: s.smtp_secure === 'true',
        auth: { user: s.smtp_user, pass: s.smtp_password },
        tls: { rejectUnauthorized: false }
      })
      await transporter.sendMail({ from: s.smtp_from || s.smtp_user, to, subject, html })
      return ok()
    } catch (e) { return err(e) }
  })

  // TÂCHES DU JOUR
  ipcMain.handle('dashboard:getTachesJour', () => {
    try {
      const anniversaires = query(`SELECT id,nom,prenom,dateNaissance,telephone,email FROM Client WHERE dateNaissance IS NOT NULL AND strftime('%m-%d',dateNaissance)=strftime('%m-%d','now')`)
      const dossiersChauds = query(`SELECT d.*,c.nom as clientNom,c.prenom as clientPrenom,c.email as clientEmail,c.telephone as clientTel FROM Dossier d LEFT JOIN Client c ON c.id=d.clientId WHERE d.estChaud=1 AND d.statut IN ('OUVERT','EN_ATTENTE') ORDER BY d.updatedAt ASC`)
      const commissionsEnRetard = query(`SELECT d.*,c.nom as clientNom,c.prenom as clientPrenom,c.email as clientEmail FROM Dossier d LEFT JOIN Client c ON c.id=d.clientId WHERE d.statutCommission='FACTUREE' AND d.dateFacturation < datetime('now','-30 days') ORDER BY d.dateFacturation ASC`)
      const finContratsProches = query(`SELECT d.*,c.nom as clientNom,c.prenom as clientPrenom,c.email as clientEmail,c.telephone as clientTel,date(d.dateLivraisonReelle,'+'||d.dureeContrat||' months') as dateFinContrat,CAST(julianday(date(d.dateLivraisonReelle,'+'||d.dureeContrat||' months'))-julianday('now') AS INTEGER) as joursRestants FROM Dossier d LEFT JOIN Client c ON c.id=d.clientId WHERE d.dateLivraisonReelle IS NOT NULL AND d.dureeContrat IS NOT NULL AND d.statut='GAGNE' AND date(d.dateLivraisonReelle,'+'||d.dureeContrat||' months')>=date('now') AND date(d.dateLivraisonReelle,'+'||d.dureeContrat||' months')<=date('now','+365 days') ORDER BY dateFinContrat ASC`)
      const suiviAnnuel = query(`SELECT d.*,c.nom as clientNom,c.prenom as clientPrenom,c.email as clientEmail FROM Dossier d LEFT JOIN Client c ON c.id=d.clientId WHERE d.dateLivraisonReelle IS NOT NULL AND d.statut='GAGNE' AND date(d.dateLivraisonReelle,'+1 year') BETWEEN date('now','-7 days') AND date('now','+7 days')`)
      const sansAvisGoogle = query(`SELECT id,nom,prenom,email,telephone FROM Client WHERE avisGoogle=0 AND email IS NOT NULL AND email!='' ORDER BY createdAt DESC LIMIT 10`)
      return ok({ anniversaires, dossiersChauds, commissionsEnRetard, finContratsProches, suiviAnnuel, sansAvisGoogle })
    } catch (e) { return err(e) }
  })

  // IMPORT EXCEL
  ipcMain.handle('import:excel', (_, filePath) => {
    try {
      const XLSX = require('xlsx')
      const wb = XLSX.readFile(filePath, { cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' })

      // Helpers
      const str = (v: any) => String(v ?? '').trim()
      const isOui = (v: any) => ['O', 'OUI', '1', 'YES', 'X'].includes(str(v).toUpperCase())
      const parseNum = (v: any): number | null => {
        if (v === null || v === undefined || str(v) === '') return null
        const n = parseFloat(str(v).replace(/[^0-9.,-]/g, '').replace(',', '.'))
        return isNaN(n) ? null : n
      }
      const parseDate = (v: any): string | null => {
        if (!v) return null
        try {
          const d = new Date(v)
          return isNaN(d.getTime()) ? null : d.toISOString()
        } catch { return null }
      }

      // Colonnes (0-indexé) :
      // 0=DATE DEMANDE  1=NOM  2=PRENOM  3=PRO/PART  4=LOA/CASH  5=NEUF/VO
      // 6=MARQUE  7=MODELE  8=CARACT.  9=PRIX/LOYER  10=APPORT  11=REPRISE O/N
      // 12=MODELE REPRISE  13=PRIX  14=KM  15=CHAUD  16=CONCESSION
      // 17=COMMANDE O/N  18=DATE LIV  19=FACTURE O/N  20=PAYE O/N
      // 21=DATE RELANCE FACT  22=MONTANT TTC  23=AVIS GOOGLE

      const year = new Date().getFullYear()
      const prefix = queryOne<{ value: string }>(`SELECT value FROM Settings WHERE key='dossier_prefix'`)?.value || 'AL'
      const rMax = queryOne<{ max: string | null }>(`SELECT MAX(numeroDossier) as max FROM Dossier WHERE numeroDossier LIKE ?`, [`${prefix}-${year}-%`])
      let counter = rMax?.max ? parseInt(rMax.max.split('-').pop() || '0') + 1 : 1

      let imported = 0
      let skipped = 0

      db.run('BEGIN TRANSACTION')
      try {
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i]
          const nom = str(r[1])
          const prenom = str(r[2])
          if (!nom) continue

          // Client
          const type = str(r[3]).toUpperCase() === 'PRO' ? 'PROFESSIONNEL' : 'PARTICULIER'
          const avisGoogle = isOui(r[23]) ? 1 : 0
          let clientId: number
          const existing = queryOne<{ id: number }>('SELECT id FROM Client WHERE nom=? AND prenom=?', [nom, prenom])
          if (!existing) {
            db.run(
              'INSERT INTO Client (nom,prenom,type,estPremierAppelant,avisGoogle,updatedAt) VALUES (?,?,?,0,?,datetime("now"))',
              [nom, prenom, type, avisGoogle]
            )
            clientId = queryOne<{ id: number }>('SELECT last_insert_rowid() as id')?.id ?? 0
          } else {
            // Mettre à jour avisGoogle si disponible
            if (avisGoogle) db.run('UPDATE Client SET avisGoogle=1 WHERE id=?', [existing.id])
            clientId = existing.id
          }

          // Dédoublonnage dossier
          const dosDate = parseDate(r[0])?.split('T')[0] ?? new Date().toISOString().split('T')[0]
          if (queryOne('SELECT id FROM Dossier WHERE clientId=? AND DATE(dateDemande)=?', [clientId, dosDate])) { skipped++; continue }

          // Financement
          const fin = str(r[4]).toUpperCase()
          const typeFinancement = fin === 'CASH' ? 'CASH' : fin === 'LOA' ? 'LOA' : 'LLD'

          // Statut & commission
          const commande = isOui(r[17])
          const paye = isOui(r[20])
          const facture = isOui(r[19])
          const statut = commande ? 'GAGNE' : 'OUVERT'
          const statutCommission = paye ? 'PAYEE' : facture ? 'FACTUREE' : null

          // Concession : chercher par nom d'entreprise
          const concessionNom = str(r[16])
          const contactPro = concessionNom
            ? queryOne<{ id: number }>('SELECT id FROM ContactPro WHERE entreprise LIKE ?', [`%${concessionNom}%`])
            : null

          const numero = `${prefix}-${year}-${String(counter).padStart(4, '0')}`
          counter++

          db.run(
            `INSERT INTO Dossier (
              numeroDossier,clientId,dateDemande,typeFinancement,statut,
              neufOuOccasion,marqueNom,modeleNom,caracteristiques,
              valeurVehicule,loyerMensuel,apport,
              repriseOuiNon,repriseModele,
              kilometrageContrat,
              estChaud,contactProId,commandeEffectuee,
              dateLivraisonReelle,statutCommission,dateRelance,montantCommission,
              updatedAt
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime("now"))`,
            [
              numero, clientId,
              parseDate(r[0]) ?? new Date().toISOString(),
              typeFinancement, statut,
              str(r[5]) || null,
              str(r[6]) || null,
              str(r[7]) || null,
              str(r[8]) || null,
              parseNum(r[13]),
              parseNum(r[9]),
              parseNum(r[10]),
              isOui(r[11]) ? 1 : 0,
              str(r[12]) || null,
              parseNum(r[14]),
              isOui(r[15]) ? 1 : 0,
              contactPro?.id ?? null,
              commande ? 1 : 0,
              parseDate(r[18]),
              statutCommission,
              parseDate(r[21]),
              parseNum(r[22]),
            ]
          )
          imported++
        }
        db.run('COMMIT')
        saveDb()
      } catch (e) {
        try { db.run('ROLLBACK') } catch {}
        throw e
      }

      return ok({ imported, skipped })
    } catch (e) { return err(e) }
  })

  // SAUVEGARDES
  ipcMain.handle('backup:create', async () => {
    try {
      const r = await dialog.showSaveDialog(mainWindow, {
        title: 'Sauvegarder la base de données',
        defaultPath: `autolead_sauvegarde_${new Date().toISOString().slice(0, 10)}.db`,
        filters: [{ name: 'Base de données SQLite', extensions: ['db'] }]
      })
      if (r.canceled || !r.filePath) return ok(null)
      writeFileSync(r.filePath, Buffer.from(db.export()))
      return ok(r.filePath)
    } catch (e) { return err(e) }
  })
  ipcMain.handle('backup:restore', async () => {
    try {
      const r = await dialog.showOpenDialog(mainWindow, {
        title: 'Restaurer une sauvegarde',
        properties: ['openFile'],
        filters: [{ name: 'Base de données SQLite', extensions: ['db'] }]
      })
      if (r.canceled || !r.filePaths[0]) return ok(null)
      // Sauvegarde de sécurité avant restauration
      writeFileSync(getDbPath(), Buffer.from(db.export()))
      backupDatabase()
      // Charger le fichier de backup
      const initSqlJs = require('sql.js')
      let wasmPath = join(app.getAppPath(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
      if (!existsSync(wasmPath)) wasmPath = join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
      const SQL = await initSqlJs({ locateFile: () => wasmPath })
      db = new SQL.Database(readFileSync(r.filePaths[0]))
      saveDb()
      return ok(r.filePaths[0])
    } catch (e) { return err(e) }
  })
  ipcMain.handle('backup:list', () => {
    try {
      const backupDir = getBackupDir()
      const files = readdirSync(backupDir)
        .filter(f => f.startsWith('crm_') && f.endsWith('.db'))
        .sort().reverse().slice(0, 10)
        .map(f => ({ name: f, size: statSync(join(backupDir, f)).size, mtime: statSync(join(backupDir, f)).mtime.toISOString() }))
      return ok(files)
    } catch (e) { return err(e) }
  })
  ipcMain.handle('backup:openFolder', () => {
    shell.openPath(getBackupDir())
    return ok()
  })
}

// Détecte un changement de version et nettoie les caches si nécessaire
async function handleVersionChange(): Promise<{ updated: boolean; from: string | null }> {
  const currentVersion = app.getVersion()
  const versionFile = join(getDataDir(), '.version')
  const storedVersion = existsSync(versionFile) ? readFileSync(versionFile, 'utf-8').trim() : null

  if (storedVersion && storedVersion !== currentVersion) {
    // Nouvelle version détectée — vider tous les caches Chromium
    try {
      await session.defaultSession.clearCache()
      await session.defaultSession.clearStorageData({
        storages: ['appcache', 'shadercache', 'serviceworkers', 'cachestorage']
      })
    } catch (e) { console.error('Cache clear failed:', e) }
    writeFileSync(versionFile, currentVersion, 'utf-8')
    return { updated: true, from: storedVersion }
  }

  writeFileSync(versionFile, currentVersion, 'utf-8')
  return { updated: false, from: storedVersion }
}

app.whenReady().then(async () => {
  migrateToNewDataDir()
  const versionInfo = await handleVersionChange()
  await initDatabase()
  registerIpcHandlers()
  setupAutoUpdater()
  createWindow()
  // Informer le renderer si une MAJ vient d'être appliquée
  if (versionInfo.updated) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('app:updated', { from: versionInfo.from, to: app.getVersion() })
    })
  }
  // Vérifier les mises à jour 5 secondes après le démarrage (en production uniquement)
  if (app.isPackaged) {
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000)
  }
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
