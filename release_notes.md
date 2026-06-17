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

## v1.0.1 — 17 juin 2026
**Corrections d'affichage & lien Client ↔ Dossier**

### Corrections
- **Fenêtre déplaçable** : bande de titre draggable ajoutée en haut (la fenêtre était figée)
- **Avatar utilisateur** : le rond bleu en haut à droite n'est plus caché sous les boutons Windows
- **Dossiers** : icône 🔥 ne déborde plus sur la colonne N° Dossier (colonne trop étroite)
- **Clients** : barre de recherche agrandie et correctement redimensionnable
- **Véhicules** : bouton "Motos" ne se tronque plus à l'affichage
- **Header** : barre de recherche globale flexible selon la largeur de la fenêtre
- **Sidebar** : logo aligné avec le header (même hauteur 52px)

### Améliorations
- **Lien Client ↔ Dossier** : le formulaire dossier initialise maintenant correctement le client lors de l'édition
- **Fiche client** : bouton "Nouveau dossier" dans l'onglet Dossiers → ouvre le formulaire avec le client pré-sélectionné

### GitHub
- Release : https://github.com/lyhar/CRM_ASB/releases/tag/v1.0.1
- Fichier : `ASB-CRM-Setup-1.0.1.exe`

---

## v1.0.2 — 17 juin 2026
**Corrections dates, navigation et données au démarrage**

### Corrections
- **Dates DATE DEMANDE** : toutes les dates des dossiers importés depuis l'Excel sont maintenant correctement lues (bug xlsx `raw:false` → corrigé avec `cellDates:true`)
- **Re-import données** : script `reimport.js` pour recorriger les données existantes (143 dossiers et 128 clients retraités)
- **Nom utilisateur header** : le nom affiché en haut à droite est maintenant lu en base (plus codé en dur)

### Améliorations
- **Clic client dans liste dossiers** : cliquer sur le nom du client dans la liste des dossiers ouvre directement sa fiche client
- **Lien Google Maps** : les fiches concessionnaire affichent un lien "Maps" pour ouvrir l'adresse dans Google Maps
- **Seed au démarrage** : concessions et marques/modèles sont automatiquement chargés à l'installation ou la mise à jour, sans avoir à relancer un script manuellement

### GitHub
- Release : https://github.com/lyhar/CRM_ASB/releases/tag/v1.0.2
- Fichier : `ASB-CRM-Setup-1.0.2.exe`

---

## v1.0.3 — 17 juin 2026
**Emails, popup tâches du jour & tableau de bord enrichi**

### Nouveautés
- **Popup de démarrage** : à l'ouverture, une notification s'affiche avec les événements du jour (anniversaires clients, affaires chaudes, factures en retard +30j, fins de contrat dans 12 mois, suivis 1 an)
- **Dashboard — onglet "Aujourd'hui"** : liste complète des tâches avec boutons email directs sur chaque item
- **3 templates d'email relance contrat** disponibles sur chaque fiche dossier (statut "Gagné") :
  - Suivi satisfaction 1 an après livraison
  - Relance 6 mois avant fin de contrat
  - Relance restitution 3 mois avant fin (avec checklist : carrosserie, révision, pneumatiques, clés)
- **Composeur d'email** : aperçu HTML, copier, ouvrir dans la messagerie, ou envoi direct via SMTP
- **Paramètres → Email / SMTP** : configuration SMTP (Gmail, Outlook…), mot de passe d'application, nom expéditeur, signature personnalisée
- **Test SMTP** : bouton "Tester la connexion" qui envoie un email de test

### Corrections
- Nom utilisateur dans le header se met à jour après modification dans Paramètres (plus codé en dur)

### GitHub
- Release : https://github.com/lyhar/CRM_ASB/releases/tag/v1.0.3
- Fichier : `ASB-CRM-Setup-1.0.3.exe`

---

## v1.0.4 — 17 juin 2026
**Image signature, éditeur de templates, email depuis client/dossier, codes postaux**

### Nouveautés
- **Image dans la signature** : ajoutez l'URL de votre logo dans Paramètres → Email / SMTP — il apparaîtra au-dessus du texte dans chaque email envoyé
- **Éditeur de templates** : nouvel onglet "Templates email" dans Paramètres pour modifier les 3 templates de relance (sujet + corps HTML) avec les variables `{{prenom}}`, `{{vehicule}}`, `{{financement}}`, `{{dateFinContrat}}`, `{{concessionnaire}}` — bouton "Restaurer défaut" par template
- **Email depuis la fiche dossier** : bouton "Envoyer un email" dans l'en-tête de chaque dossier (affiché si l'email client est renseigné) — ouvre le composeur avec l'adresse pré-remplie
- **Email depuis la fiche client** : même bouton dans l'en-tête de chaque fiche client

### Corrections
- Codes postaux des concessions renseignés pour les principales villes françaises

### GitHub
- Release : https://github.com/lyhar/CRM_ASB/releases/tag/v1.0.4
- Fichier : `ASB-CRM-Setup-1.0.4.exe`

---

## v1.3.6 — 17 juin 2026
**Droits d'écriture et dossier de données**

### Corrections
- L'application teste maintenant réellement que le dossier de données est écrivable au démarrage.
- Si le dossier configuré par l'installation n'est pas accessible en écriture, l'application bascule vers un dossier sûr au lieu de planter.
- Les nouvelles installations utilisent un dossier de données partagé sous ProgramData plutôt qu'un dossier voisin de l'exe dans Program Files.
- Les droits d'écriture du dossier de données sont appliqués via le SID Windows des utilisateurs, plus fiable sur Windows en français.

### Technique
- Évite de lancer l'application en administrateur à chaque ouverture.
- L'installation reste per-machine/admin, mais l'utilisation quotidienne ne devrait plus dépendre des droits administrateur.

### GitHub
- Release : https://github.com/lyhar/CRM_ASB/releases/tag/v1.3.6
- Fichier : `CRM Trajectoire Setup 1.3.6.exe`

---

## v1.3.5 — 17 juin 2026
**Refonte graphique et corrections de mise en page**

### Améliorations
- Nouvelle direction visuelle anthracite/cuivre avec thème clair/sombre.
- Layout principal, sidebar, header, cartes, boutons, formulaires et badges harmonisés.
- Dashboard enrichi avec rendu responsive des KPIs, graphiques et tableaux.
- Pages clients, dossiers, commissions, concessionnaires, véhicules et formulaires rendues plus robustes sur petites fenêtres.
- Tableaux protégés contre les débordements avec scroll horizontal quand nécessaire.

### Corrections
- Réactivation complète des utilitaires Tailwind après la refonte graphique.
- Correction des lignes de tableau qui étaient transformées en grilles CSS.
- Correction du tooltip du camembert et des graphiques pour rendre le texte lisible au survol.
- Amélioration du contraste des textes secondaires et du texte discret.
- Modales et notifications adaptées aux petites largeurs.

### Technique
- Synchronisation de `package-lock.json` avec la version `1.3.5`.

### GitHub
- Release : https://github.com/lyhar/CRM_ASB/releases/tag/v1.3.5
- Fichier : `CRM Trajectoire Setup 1.3.5.exe`

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
