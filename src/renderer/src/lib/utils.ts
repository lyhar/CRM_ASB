import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string | Date | null | undefined, fmt = 'dd/MM/yyyy'): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return '-'
    return format(d, fmt, { locale: fr })
  } catch {
    return '-'
  }
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('fr-FR').format(value)
}

export const STATUT_LABELS: Record<string, string> = {
  OUVERT: 'Ouvert',
  GAGNE: 'Gagné',
  PERDU: 'Perdu',
  EN_ATTENTE: 'En attente'
}

export const STATUT_COLORS: Record<string, string> = {
  OUVERT: 'bg-accent-blue/20 text-accent-blue',
  GAGNE: 'bg-accent-green/20 text-accent-green',
  PERDU: 'bg-accent-red/20 text-accent-red',
  EN_ATTENTE: 'bg-accent-yellow/20 text-accent-yellow'
}

export const FINANCEMENT_LABELS: Record<string, string> = {
  LLD: 'LLD',
  LOA: 'LOA',
  CASH: 'Cash'
}

export const FINANCEMENT_COLORS: Record<string, string> = {
  LLD: 'bg-purple-500/20 text-purple-400',
  LOA: 'bg-blue-500/20 text-blue-400',
  CASH: 'bg-emerald-500/20 text-emerald-400'
}

export const COMMISSION_LABELS: Record<string, string> = {
  A_FACTURER: 'À facturer',
  FACTUREE: 'Facturée',
  PAYEE: 'Payée'
}

export const COMMISSION_COLORS: Record<string, string> = {
  A_FACTURER: 'bg-accent-orange/20 text-accent-orange',
  FACTUREE: 'bg-accent-blue/20 text-accent-blue',
  PAYEE: 'bg-accent-green/20 text-accent-green'
}

export const LIVRAISON_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_AVANCE: 'En avance',
  A_L_HEURE: 'À l\'heure',
  EN_RETARD: 'En retard',
  LIVREE: 'Livrée'
}

export const ENERGIE_LABELS: Record<string, string> = {
  DIESEL: 'Diesel',
  ESSENCE: 'Essence',
  ELECTRIQUE: 'Électrique',
  HYBRIDE: 'Hybride',
  HYBRIDE_RECHARGEABLE: 'Hybride rechargeable',
  HYDROGENE: 'Hydrogène'
}

export const DOCUMENT_LABELS: Record<string, string> = {
  PERMIS: 'Permis de conduire',
  RIB: 'RIB',
  CNI: "Carte d'identité",
  PASSEPORT: 'Passeport',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  BILAN_COMPTABLE: 'Bilan comptable',
  KBIS: 'K-BIS',
  AUTRE: 'Autre'
}
