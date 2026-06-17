import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Users
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  createUser: (data: unknown) => ipcRenderer.invoke('users:create', data),
  updateUser: (id: number, data: unknown) => ipcRenderer.invoke('users:update', id, data),
  deleteUser: (id: number) => ipcRenderer.invoke('users:delete', id),

  // Clients
  getClients: (filters?: unknown) => ipcRenderer.invoke('clients:getAll', filters),
  getClient: (id: number) => ipcRenderer.invoke('clients:getOne', id),
  createClient: (data: unknown) => ipcRenderer.invoke('clients:create', data),
  updateClient: (id: number, data: unknown) => ipcRenderer.invoke('clients:update', id, data),
  deleteClient: (id: number) => ipcRenderer.invoke('clients:delete', id),
  searchClients: (query: string) => ipcRenderer.invoke('clients:search', query),

  // Dossiers
  getDossiers: (filters?: unknown) => ipcRenderer.invoke('dossiers:getAll', filters),
  getDossier: (id: number) => ipcRenderer.invoke('dossiers:getOne', id),
  createDossier: (data: unknown) => ipcRenderer.invoke('dossiers:create', data),
  updateDossier: (id: number, data: unknown) => ipcRenderer.invoke('dossiers:update', id, data),
  deleteDossier: (id: number) => ipcRenderer.invoke('dossiers:delete', id),
  getNextNumero: () => ipcRenderer.invoke('dossiers:getNextNumero'),

  // Contacts Pro
  getContactsPro: (filters?: unknown) => ipcRenderer.invoke('contactsPro:getAll', filters),
  getContactPro: (id: number) => ipcRenderer.invoke('contactsPro:getOne', id),
  createContactPro: (data: unknown) => ipcRenderer.invoke('contactsPro:create', data),
  updateContactPro: (id: number, data: unknown) =>
    ipcRenderer.invoke('contactsPro:update', id, data),
  deleteContactPro: (id: number) => ipcRenderer.invoke('contactsPro:delete', id),

  // Marques & Modèles
  getMarques: (type?: string) => ipcRenderer.invoke('marques:getAll', type),
  createMarque: (data: unknown) => ipcRenderer.invoke('marques:create', data),
  updateMarque: (id: number, data: unknown) => ipcRenderer.invoke('marques:update', id, data),
  deleteMarque: (id: number) => ipcRenderer.invoke('marques:delete', id),
  getModeles: (marqueId: number) => ipcRenderer.invoke('modeles:getAll', marqueId),
  createModele: (data: unknown) => ipcRenderer.invoke('modeles:create', data),
  updateModele: (id: number, data: unknown) => ipcRenderer.invoke('modeles:update', id, data),
  deleteModele: (id: number) => ipcRenderer.invoke('modeles:delete', id),

  // Documents
  getDocuments: (filters: unknown) => ipcRenderer.invoke('documents:getAll', filters),
  uploadDocument: (data: unknown) => ipcRenderer.invoke('documents:upload', data),
  deleteDocument: (id: number) => ipcRenderer.invoke('documents:delete', id),
  openDocument: (chemin: string) => ipcRenderer.invoke('documents:open', chemin),

  // Relances
  createRelance: (data: unknown) => ipcRenderer.invoke('relances:create', data),
  updateRelance: (id: number, data: unknown) => ipcRenderer.invoke('relances:update', id, data),
  deleteRelance: (id: number) => ipcRenderer.invoke('relances:delete', id),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),

  // Import Excel
  importExcel: (filePath: string) => ipcRenderer.invoke('import:excel', filePath),

  // File dialog
  openFileDialog: (options?: unknown) => ipcRenderer.invoke('dialog:openFile', options),
  openDocumentDialog: () => ipcRenderer.invoke('dialog:openDocument'),

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  confirm: (message: string) => ipcRenderer.invoke('dialog:confirm', message),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),

  // Email
  sendEmail: (data: { to: string; subject: string; html: string }) => ipcRenderer.invoke('email:send', data),

  // Image
  readImageAsBase64: () => ipcRenderer.invoke('image:readAsBase64'),

  // Tâches du jour
  getTachesJour: () => ipcRenderer.invoke('dashboard:getTachesJour'),

  // Mises à jour
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  onUpdateAvailable: (cb: (info: { version: string }) => void) =>
    ipcRenderer.on('update:available', (_, info) => cb(info)),
  onUpdateNotAvailable: (cb: () => void) =>
    ipcRenderer.on('update:not-available', () => cb()),
  onUpdateProgress: (cb: (p: { percent: number }) => void) =>
    ipcRenderer.on('update:progress', (_, p) => cb(p)),
  onUpdateDownloaded: (cb: () => void) =>
    ipcRenderer.on('update:downloaded', () => cb()),
  onUpdateError: (cb: (msg: string) => void) =>
    ipcRenderer.on('update:error', (_, msg) => cb(msg)),
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update:available')
    ipcRenderer.removeAllListeners('update:not-available')
    ipcRenderer.removeAllListeners('update:progress')
    ipcRenderer.removeAllListeners('update:downloaded')
    ipcRenderer.removeAllListeners('update:error')
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
