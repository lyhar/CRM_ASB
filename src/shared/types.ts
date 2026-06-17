export type UserRole = 'ADMIN' | 'AGENT'
export type ClientType = 'PARTICULIER' | 'PROFESSIONNEL'
export type TypeFinancement = 'LLD' | 'LOA' | 'CASH'
export type StatutDossier = 'OUVERT' | 'GAGNE' | 'PERDU' | 'EN_ATTENTE'
export type TypeVehicule = 'VOITURE' | 'MOTO'
export type Energie = 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE' | 'HYBRIDE_RECHARGEABLE' | 'HYDROGENE'
export type NeufOuOccasion = 'NEUF' | 'OCCASION'
export type RepriseEtat = 'TRES_BON' | 'BON' | 'MOYEN' | 'MAUVAIS'
export type StatutLivraison = 'EN_ATTENTE' | 'EN_AVANCE' | 'A_L_HEURE' | 'EN_RETARD' | 'LIVREE'
export type StatutCommission = 'A_FACTURER' | 'FACTUREE' | 'PAYEE'
export type TypeDocument =
  | 'PERMIS'
  | 'RIB'
  | 'CNI'
  | 'PASSEPORT'
  | 'JUSTIFICATIF_DOMICILE'
  | 'BILAN_COMPTABLE'
  | 'KBIS'
  | 'AUTRE'
export type MarqueType = 'VOITURE' | 'MOTO'

export interface IUser {
  id: number
  nom: string
  prenom: string
  email: string
  role: UserRole
  actif: boolean
  createdAt: string
}

export interface IClient {
  id: number
  type: ClientType
  nom: string
  prenom: string
  dateNaissance?: string
  adresse?: string
  codePostal?: string
  ville?: string
  telephone?: string
  email?: string
  estPremierAppelant: boolean
  referentId?: number
  referent?: { id: number; nom: string; prenom: string }
  nombreContactsAmenes: number
  avisGoogle: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  createdById?: number
  _count?: { dossiers: number }
}

export interface IContactPro {
  id: number
  nom: string
  prenom?: string
  entreprise: string
  adresse?: string
  codePostal?: string
  ville?: string
  telephone?: string
  email?: string
  siret?: string
  notes?: string
  actif: boolean
  createdAt: string
  updatedAt: string
  _count?: { dossiers: number }
  totalCommissions?: number
}

export interface IMarque {
  id: number
  nom: string
  type: MarqueType
  actif: boolean
  modeles?: IModele[]
  _count?: { modeles: number }
}

export interface IModele {
  id: number
  nom: string
  marqueId: number
  actif: boolean
}

export interface IDossier {
  id: number
  numeroDossier: string
  clientId: number
  client?: IClient
  dateDemande: string
  typeFinancement: TypeFinancement
  statut: StatutDossier
  typeVehicule?: TypeVehicule
  marqueNom?: string
  modeleNom?: string
  energie?: Energie
  neufOuOccasion?: NeufOuOccasion
  caracteristiques?: string
  valeurVehicule?: number
  loyerMensuel?: number
  premierLoyerMajore?: number
  dureeContrat?: number
  kilometrageContrat?: number
  apport?: number
  repriseOuiNon: boolean
  repriseMarque?: string
  repriseModele?: string
  repriseValeur?: number
  repriseEtat?: RepriseEtat
  contactProId?: number
  contactPro?: IContactPro
  nomVendeur?: string
  lieuPriseCommande?: string
  dateCommande?: string
  commandeEffectuee: boolean
  dateLivraisonPrevue?: string
  dateLivraisonReelle?: string
  statutLivraison?: StatutLivraison
  montantCommission?: number
  statutCommission?: StatutCommission
  dateFacturation?: string
  datePaiement?: string
  dateRelance?: string
  estChaud: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  createdById?: number
  createdBy?: IUser
  documents?: IDocument[]
  relances?: IRelance[]
}

export interface IDocument {
  id: number
  dossierId?: number
  clientId?: number
  typeDocument: TypeDocument
  nomFichier: string
  cheminFichier: string
  createdAt: string
}

export interface IRelance {
  id: number
  dossierId: number
  dateRelance: string
  notes?: string
  effectuee: boolean
  createdAt: string
}

export interface IDashboardStats {
  dossiersOuverts: number
  dossiersGagnes: number
  dossiersPerdus: number
  dossiersEnAttente: number
  commissionsTotal: number
  commissionsPayees: number
  commissionsEnAttente: number
  commissionsAFacturer: number
  tauxConversion: number
  livraisonsEnRetard: number
  commissionsMois: { mois: string; montant: number }[]
  dernierssDossiers: IDossier[]
}

export interface IpcResponse<T> {
  success: boolean
  data?: T
  error?: string
}
