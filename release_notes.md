# ASB CRM — Notes de version

## v1.0.0 — 17 juin 2026
**Première version officielle**

### Fonctionnalités
- **Dashboard** : 4 KPIs (dossiers ouverts, commissions totales, en attente, taux de conversion), graphique donut répartition dossiers, graphique barres commissions 6 derniers mois, tableau 10 derniers dossiers, alerte livraisons en retard
- **Dossiers** : liste filtrée (statut, financement, recherche), voyant livraison vert/rouge, badge 🔥 chaud, formulaire complet 4 sections (véhicule, financement, commande/concession, commission), numéro auto ASB-YYYY-NNNN
- **Clients** : fiche complète (infos, dossiers, documents), parrainage, badge premier appelant, type particulier/professionnel
- **Concessionnaires** : fiche + stats (nb dossiers, commission totale), historique dossiers liés
- **Commissions** : vue dédiée par statut (à facturer / facturées / payées) + totaux
- **Véhicules** : CRUD marques/modèles, filtre voiture/moto
- **Paramètres** : gestion utilisateurs + import Excel

### Données pré-chargées
- 691 modèles (48 marques voiture + 18 marques moto)
- 426 concessions françaises (32 partenaires ASB + 394 nationales par marque et ville)
- 128 clients + 143 dossiers importés depuis l'Excel historique (oct. 2024 → juin 2026)
- Utilisateur admin : Antoine / admin@asb.fr

### Technique
- Electron 33 + React 18 + TypeScript + TailwindCSS
- SQLite local (sql.js) dans AppData — données préservées à chaque mise à jour
- Auto-update via GitHub Releases (electron-updater)
- Installateur NSIS Windows avec raccourci bureau

### GitHub
- Release : https://github.com/lyhar/CRM_ASB/releases/tag/v1.0.0
- Fichier : `ASB-CRM-Setup-1.0.0.exe` (~90 Mo)

---

## Template pour prochaines versions

## vX.X.X — JJ mois AAAA
**[Titre court de la version]**

### Nouveautés
-

### Corrections
-

### Technique
-

### GitHub
- Release : https://github.com/lyhar/CRM_ASB/releases/tag/vX.X.X
- Fichier : `ASB-CRM-Setup-X.X.X.exe`
