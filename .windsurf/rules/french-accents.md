---
trigger: manual
---

french-accents

description: Règle stricte pour corriger les accents et caractères français dans tous les textes
---
 
# Règle Stricte - Accents et Caractères Français
 
## Objectif
 
Lors de **toute modification** d'un fichier contenant du texte en français (labels, placeholders, messages, titres, descriptions), **TOUJOURS** vérifier et corriger les textes pour respecter les accents et caractères français.
 
## Corrections Obligatoires
 
| Caractère | Exemple correct | Exemple incorrect |
|-----------|-----------------|-------------------|
| é (e accent aigu) | Créer, Terminé | Creer, Termine |
| è (e accent grave) | Première, Espèces | Premiere, Especes |
| ê (e accent circonflexe) | Prêt, Être | Pret, Etre |
| à (a accent grave) | À emporter | A emporter |
| ç (c cédille) | Reçu, Français | Recu, Francais |
| û (u accent circonflexe) | Sûr | Sur (adjectif) |
| ï (i tréma) | Naïf | Naif |
| œ (oe ligature) | Cœur | Coeur |
 
## Liste des Corrections Courantes
 
```
"Numero" → "Numéro"
"Cree" → "Créé"
"Modifie" → "Modifié"
"Supprime" → "Supprimé"
"Termine" → "Terminé"
"Prepare" → "Préparé"
"Pret" → "Prêt"
"Echoue" → "Échoué"
"A emporter" → "À emporter"
"Gerez" → "Gérez"
"Selectionnez" → "Sélectionnez"
"Annule" → "Annulé"
"Autorise" → "Autorisé"
"Paye" → "Payé"
"Rembourse" → "Remboursé"
"Especes" → "Espèces"
"Presentez" → "Présentez"
"Speciales" → "Spéciales"
"Confirmees" → "Confirmées"
"Terminees" → "Terminées"
"Annulees" → "Annulées"
"Pretes" → "Prêtes"
"En preparation" → "En préparation"
"Validee" → "Validée"
"Enregistre" → "Enregistré"
"Ajoute" → "Ajouté"
"Mis a jour" → "Mis à jour"
"Cloture" → "Clôturé"
"Resolu" → "Résolu"
```
 
## Règles Importantes
 
1. **Ne JAMAIS casser le code** - Modifier UNIQUEMENT les chaînes de caractères visibles par l'utilisateur
2. **Ne PAS modifier** :
   - Les noms de variables
   - Les noms de fonctions
   - Les noms de props
   - Les valeurs d'enum (ex: `PENDING`, `COMPLETED`)
   - Les clés d'objets utilisées programmatiquement
3. **Modifier** :
   - Les textes dans JSX (`<p>Texte</p>`)
   - Les labels de formulaires
   - Les placeholders d'inputs
   - Les messages toast
   - Les titres et descriptions
   - Les valeurs affichées dans les objets de mapping (ex: `{ PENDING: 'En attente' }`)
 
## Application
 
Cette règle s'applique **automatiquement** à chaque modification de fichier. Lors de l'édition d'un fichier, scanner les textes visibles et corriger les accents manquants.
 
