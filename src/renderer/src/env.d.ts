/// <reference types="vite/client" />

interface Window {
  api: {
    getUsers: () => Promise<any>
    createUser: (data: any) => Promise<any>
    updateUser: (id: number, data: any) => Promise<any>
    deleteUser: (id: number) => Promise<any>

    getClients: (filters?: any) => Promise<any>
    getClient: (id: number) => Promise<any>
    createClient: (data: any) => Promise<any>
    updateClient: (id: number, data: any) => Promise<any>
    deleteClient: (id: number) => Promise<any>
    searchClients: (query: string) => Promise<any>

    getDossiers: (filters?: any) => Promise<any>
    getDossier: (id: number) => Promise<any>
    getAdjacentDossiers: (id: number) => Promise<any>
    createDossier: (data: any) => Promise<any>
    updateDossier: (id: number, data: any) => Promise<any>
    deleteDossier: (id: number) => Promise<any>
    getNextNumero: () => Promise<any>

    getContactsPro: (filters?: any) => Promise<any>
    getContactPro: (id: number) => Promise<any>
    createContactPro: (data: any) => Promise<any>
    updateContactPro: (id: number, data: any) => Promise<any>
    deleteContactPro: (id: number) => Promise<any>

    getMarques: (type?: string) => Promise<any>
    createMarque: (data: any) => Promise<any>
    updateMarque: (id: number, data: any) => Promise<any>
    deleteMarque: (id: number) => Promise<any>
    getModeles: (marqueId: number) => Promise<any>
    createModele: (data: any) => Promise<any>
    updateModele: (id: number, data: any) => Promise<any>
    deleteModele: (id: number) => Promise<any>

    getDocuments: (filters: any) => Promise<any>
    uploadDocument: (data: any) => Promise<any>
    deleteDocument: (id: number) => Promise<any>
    openDocument: (chemin: string) => Promise<any>

    createRelance: (data: any) => Promise<any>
    updateRelance: (id: number, data: any) => Promise<any>
    deleteRelance: (id: number) => Promise<any>

    getDashboardStats: (year?: number) => Promise<any>
    importExcel: (filePath: string) => Promise<any>
    openFileDialog: (options?: any) => Promise<any>
    openDocumentDialog: () => Promise<any>
  }
}
