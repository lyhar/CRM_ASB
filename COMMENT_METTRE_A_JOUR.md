# Comment publier une mise à jour de ASB CRM

## Prérequis (une seule fois)
1. Avoir Node.js installé sur le PC de développement
2. Avoir un token GitHub avec les droits `repo` :
   - Aller sur https://github.com/settings/tokens
   - New token → cocher `repo` → copier le token
3. Créer un fichier `.env` à la racine du projet :
   ```
   GH_TOKEN=ghp_VOTRE_TOKEN_ICI
   ```

## Processus de mise à jour

### 1. Faire les modifications dans le code

### 2. Incrémenter la version dans package.json
```json
"version": "1.0.1"   ← changer ce numéro
```
Convention :
- `1.0.X` = correction de bug
- `1.X.0` = nouvelle fonctionnalité
- `X.0.0` = refonte majeure

### 3. Publier la mise à jour
```bash
npm run publish:win
```
Cette commande :
- Compile l'application
- Crée le fichier d'installation Windows
- Publie automatiquement sur GitHub Releases

### 4. C'est tout !
L'application sur l'autre PC détectera la mise à jour au prochain démarrage
et proposera de l'installer automatiquement.

## Ce qui se passe côté utilisateur
1. L'app se lance normalement
2. Après 5 secondes, elle vérifie GitHub en arrière-plan
3. Si une nouvelle version existe → notification en bas à droite
4. L'utilisateur clique "Télécharger"
5. Barre de progression pendant le téléchargement
6. Bouton "Redémarrer et installer"
7. L'app redémarre avec la nouvelle version, données conservées

## Notes importantes
- La base de données (crm.db) est TOUJOURS préservée lors des mises à jour
- Elle est stockée dans AppData, séparée de l'application
- Même en désinstallant/réinstallant, les données restent
