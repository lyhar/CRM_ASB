# ASB CRM — Contexte Projet

## Qui est Antoine
Apporteur d'affaires automobile et moto — intermédiaire entre particuliers/professionnels et concessionnaires.  
Produits : LLD, LOA, achat comptant, multimarque voiture et moto.

## Stack technique
| Composant | Techno |
|---|---|
| Shell desktop | Electron v33 |
| UI | React 18 + TypeScript + Vite |
| Style | TailwindCSS v3 (palette sombre #0f0f0f) |
| Base de données | SQLite via sql.js (pur JS, pas de compilation native) |
| ORM | Pas de Prisma — SQL brut via sql.js |
| Graphiques | Recharts |
| Formulaires | react-hook-form + zod |
| Icônes | lucide-react |
| Dates | date-fns |
| Import Excel | xlsx |
| Auto-update | electron-updater → GitHub Releases |
| Packaging | electron-builder → NSIS installer |

## Chemins importants
| Quoi | Où |
|---|---|
| Code source | `D:\projet\Antoine\CRM\` |
| Base de données | `C:\Users\levav\AppData\Roaming\asb-crm\crm.db` |
| Documents uploadés | `C:\Users\levav\AppData\Roaming\asb-crm\documents\` |
| Token GitHub | `D:\projet\Antoine\CRM\.env` (GH_TOKEN=...) |
| Seed marques/modèles | `D:\projet\Antoine\CRM\context\seeds\marques_modeles.json` |
| Excel original | `D:\projet\Antoine\CRM\context\Fichier de suivi ASB (4).xlsx` |
| Script import | `D:\projet\Antoine\CRM\scripts\import.js` |

## GitHub
- Repo : https://github.com/lyhar/CRM_ASB
- Owner : lyhar
- Releases : https://github.com/lyhar/CRM_ASB/releases
- Token : dans `.env` (GH_TOKEN) — classic token `ghp_...` avec scope `repo`

## Commandes clés
```bash
npm run dev           # Lancer en mode développement
npm run build:win     # Compiler le .exe sans publier
npm run publish:win   # Compiler + publier sur GitHub Releases
node scripts/import.js  # Ré-importer les données Excel
```
Ou double-cliquer `Publier mise a jour.bat` pour publier sans terminal.

## Base de données — Tables
| Table | Contenu |
|---|---|
| User | Utilisateurs CRM (nom, prenom, email, role ADMIN/AGENT) |
| Client | Clients particuliers et pros |
| ContactPro | Concessionnaires / partenaires |
| Marque | Marques voiture et moto |
| Modele | Modèles par marque |
| Dossier | Demandes/commandes (table centrale) |
| Document | Fichiers importés (permis, RIB, CNI...) |
| Relance | Relances liées aux dossiers |

## Données en base (après import initial)
- **128 clients** (importés depuis l'Excel)
- **143 dossiers** (oct. 2024 → juin 2026)
- **426 concessions** (32 partenaires ASB + 394 nationales)
- **691 modèles** (48 marques voiture + 18 marques moto)
- **1 utilisateur admin** : Antoine / admin@asb.fr

## Structure des dossiers (champs clés)
- Type financement : `LLD`, `LOA`, `CASH`
- Statut : `OUVERT`, `EN_ATTENTE`, `GAGNE`, `PERDU`
- Type véhicule : `VOITURE`, `MOTO`
- Énergie : `DIESEL`, `ESSENCE`, `ELECTRIQUE`, `HYBRIDE`, `HYBRIDE_RECHARGEABLE`, `HYDROGENE`
- Neuf/Occasion : `NEUF`, `OCCASION`
- Statut livraison : `EN_ATTENTE`, `EN_AVANCE`, `A_L_HEURE`, `EN_RETARD`, `LIVREE`
- Statut commission : `A_FACTURER`, `FACTUREE`, `PAYEE`
- Numéro dossier : format `ASB-YYYY-NNNN` (ex: ASB-2026-0001)

## Pages de l'application
| Page | Route | Contenu |
|---|---|---|
| Dashboard | `/dashboard` | KPIs, donut dossiers, graphe commissions 6 mois, derniers dossiers, alertes retard |
| Dossiers | `/dossiers` | Liste filtrée, voyant livraison vert/rouge, badge 🔥 chaud, formulaire complet |
| Clients | `/clients` | Liste, parrainage, premier appelant, fiche détail onglets |
| Concessionnaires | `/contacts-pro` | Fiche + stats commissions par concession |
| Commissions | `/commissions` | Vue par statut + totaux |
| Véhicules | `/vehicules` | CRUD marques/modèles |
| Paramètres | `/parametres` | Gestion users + import Excel |

## Architecture IPC (communication Electron ↔ React)
Tous les accès DB passent par `ipcMain.handle` dans `src/main/index.ts`.  
Exposés au renderer via `src/preload/index.ts` → `window.api.xxx()`.

## Auto-update
- `electron-updater` configuré sur `lyhar/CRM_ASB`
- Vérification automatique 5 secondes après démarrage (production uniquement)
- Notification UI : composant `UpdateNotification.tsx` (bas droite)
- `releaseType: "release"` → releases publiées directement (pas en draft)

## Points d'attention
- sql.js écrit le fichier DB à chaque `saveDb()` — pas de WAL mode
- Le token GitHub est dans `.env` (ignoré par git) — ne JAMAIS le commiter
- `node_modules/`, `out/`, `dist/`, `*.db` sont dans `.gitignore`
- Pas de signature de code (`CSC_IDENTITY_AUTO_DISCOVERY=false` au build)
- Mode développeur Windows requis pour le build (symlinks 7z)
- L'icône app n'est pas encore définie (icône Electron par défaut)

## Améliorations prévues / backlog
- [ ] Icône personnalisée ASB pour l'app et l'installateur
- [ ] Export PDF des fiches client / contrats
- [ ] Statistiques avancées (CA par période, par concessionnaire)
- [ ] Système de relances avec notifications
- [ ] Recherche globale améliorée
- [ ] Mode multi-utilisateurs avec sessions
