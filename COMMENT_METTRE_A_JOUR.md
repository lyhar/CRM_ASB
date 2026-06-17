# Comment publier une mise à jour de ASB CRM

## Processus complet (3 étapes)

### Étape 1 — Modifier le code
Faire les changements voulus dans le projet.

### Étape 2 — Incrémenter la version dans package.json
Ouvrir `package.json` et changer le numéro de version :
```json
"version": "1.0.1"
```

Convention :
- `1.0.X` → correction de bug
- `1.X.0` → nouvelle fonctionnalité  
- `X.0.0` → refonte majeure

### Étape 3 — Publier
Double-cliquer sur **`Publier mise a jour.bat`**

C'est tout. Le script lit automatiquement le token depuis `.env`.

---

## Ce qui se passe côté utilisateur
1. L'app se lance normalement
2. Après 5 secondes → vérification silencieuse de GitHub
3. Si nouvelle version → notification en bas à droite
4. Clic **Télécharger** → barre de progression
5. Clic **Redémarrer et installer** → relance avec la nouvelle version
6. **Données 100% préservées** (base dans AppData, séparée de l'app)

---

## Fichiers importants
| Fichier | Rôle |
|---|---|
| `.env` | Contient le token GitHub (ne jamais partager) |
| `package.json` | Contient le numéro de version à incrémenter |
| `Publier mise a jour.bat` | Lance la compilation + publication |
| `dist/ASB CRM Setup X.X.X.exe` | Installateur généré (peut être copié manuellement) |

---

## En cas de problème
- **Token expiré** : régénérer sur github.com/settings/tokens et mettre à jour `.env`
- **Pas d'internet** : copier manuellement `dist/ASB CRM Setup X.X.X.exe` sur l'autre PC
- **Erreur de build** : vérifier que Node.js est installé et relancer
