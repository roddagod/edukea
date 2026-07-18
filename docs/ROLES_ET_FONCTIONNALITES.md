# Edukea — Rôles & Fonctionnalités

> Document de référence pour la conception produit et la matrice de permissions.
> Version 1.0 — 2026-04-27

---

## Sommaire

1. [Hiérarchie des rôles](#hiérarchie-des-rôles)
2. [Fondateur](#1-fondateur)
3. [Gestionnaire d'établissement](#2-gestionnaire-détablissement)
4. [Directeur](#3-directeur)
5. [Censeur](#4-censeur)
6. [Enseignant](#5-enseignant)
7. [Parent](#6-parent)
8. [Matrice transversale](#matrice-transversale)

---

## Hiérarchie des rôles

```
Fondateur (multi-écoles, lecture seule)
    └── Gestionnaire d'établissement (1 école, plein pouvoir opérationnel)
            ├── Directeur (1 école, pédagogique + RH)
            │      └── Censeur (sous-périmètre = N classes/cycles assignés)
            │             └── Enseignant (ses classes & matières)
            └── Parent (ses enfants uniquement)
```

Chaque rôle hérite du périmètre du rôle parent **dans son propre scope** ; le scope est calculé via `school_id`, `classroom_id` ou table d'assignation explicite.

---

## 1. Fondateur

**Rôle** : propriétaire SaaS / investisseur. Vue exécutive cross-écoles, **lecture seule**.

### Dashboard exécutif
- Chiffre d'affaires consolidé (mensuel, trimestriel, annuel)
- CA par école avec comparaison période précédente
- Taux de recouvrement global et par école
- Marge brute estimée par école
- Top 5 / Flop 5 écoles (CA, croissance, satisfaction)

### KPIs scolaires consolidés
- Effectifs totaux (élèves, enseignants, classes)
- Évolution des inscriptions par école
- Taux de réussite par établissement
- Taux d'absentéisme moyen
- NPS / satisfaction parents

### Finances cross-écoles
- Encaissements ventilés par mode de paiement (Mobile Money, Wave, espèces, virement, carte)
- Impayés et créances par école
- Historique des transactions exportable

### Pilotage SaaS
- Nombre d'utilisateurs actifs (DAU/MAU)
- Taux d'adoption par module (notes, paiements, messagerie)
- Sessions, durée moyenne d'utilisation
- Croissance des écoles abonnées

### Audit & conformité
- Journal des actions sensibles : suppression d'élève, modification de notes après publication, accès admin
- Filtres par école, par utilisateur, par période

### Exports & rapports
- Exports CSV / Excel / PDF
- Rapports périodiques planifiables (envoi automatique par email)
- Données prêtes pour conseil d'administration

**Restrictions** : ne peut créer aucun compte, ne peut modifier aucune donnée opérationnelle.

---

## 2. Gestionnaire d'établissement

**Rôle** : COO / responsable administratif et financier d'une école.

### Finances
- Définition de la grille tarifaire (frais d'inscription, scolarité par niveau, options : cantine, transport, internat)
- Création des échéanciers de paiement par élève (tranches, dates limites, pénalités)
- Encaissement multi-canal : Mobile Money, Wave, espèces, virement, carte bancaire
- Génération automatique de reçus PDF horodatés
- Relances automatiques aux parents en retard (SMS, email, push)
- Gestion des bourses & remises (sociale, mérite, fratrie, personnel)
- Rapports financiers : balance, journal de caisse, restes à recouvrer, prévisionnel
- Clôture de période et exports comptables

### Gestion d'établissement
- Configuration des salles, infrastructures, capacités
- Calendrier scolaire annuel (rentrée, vacances, examens, jours fériés)
- Gestion du personnel : création des comptes (directeur, censeur, enseignant), contrats, paie légère
- Paramétrage pédagogique global : barème de notation (sur 10/20/100), système de bulletins, langues d'enseignement, coefficients par matière

### Emploi du temps
- Construction et publication globale de l'emploi du temps
- Assistant anti-conflit (salle, prof, classe)
- Gestion des remplacements et permutations
- Notifications automatiques aux parties concernées

### Inscriptions / Réinscriptions
- Création et publication d'une campagne d'inscription (formulaire public, pièces requises)
- Validation des dossiers, génération automatique du matricule
- Affectation à une classe selon les règles définies
- Réinscriptions en masse en fin d'année (passage automatique de classe)
- Tableau de pilotage : places restantes, taux de remplissage par classe et niveau
- Liste d'attente automatique

### Communication
- Annonces officielles à toute l'école ou ciblées par niveau/classe
- Modèles de courriers (admission, réorientation, fin de scolarité)

---

## 3. Directeur

**Rôle** : chef pédagogique d'une école.

### Gestion pédagogique
- Composition des classes : affectation, transfert, mutation d'élèves
- Affectation enseignants ↔ matières ↔ classes
- Validation des bulletins avant publication aux parents
- Organisation et tenue des conseils de classe (PV, décisions de passage, redoublement)
- Suivi des effectifs en temps réel (entrées, sorties, mutations)

### Emploi du temps
- Édition et ajustement de l'EDT (mêmes outils que le gestionnaire)
- Validation finale avant publication aux parents/élèves
- Gestion des séances exceptionnelles (devoirs surveillés, sorties)

### Vie scolaire (vue transverse)
- Tableau de bord global : sanctions, retards, absences anormales
- Convocations aux parents pour dossiers sensibles
- Coordination avec les censeurs

### Suivi enseignants
- Tableau d'activité par enseignant (saisie de notes à jour, appel fait, devoirs publiés)
- Évaluation interne, retours pédagogiques

### Communication
- Annonces pédagogiques (réunions parents, événements)
- Messagerie avec tout le personnel

**Restrictions** : pas d'accès à la grille tarifaire ni aux encaissements.

---

## 4. Censeur

**Rôle** : directeur adjoint sur un sous-périmètre défini (N classes, un cycle, un niveau).

> Le périmètre est explicite et stocké en base via `vice_principal_scopes`.

### Périmètre & vue
- Vue par défaut limitée aux classes de son scope
- Tableau de bord : effectifs, performances, alertes vie scolaire de son périmètre

### Pédagogie (sur scope)
- Validation des bulletins de ses classes
- Suivi de la saisie des notes par les enseignants de son scope
- Rapports de performance par classe et matière

### Vie scolaire (sur scope)
- Suivi des absences, retards, sanctions de ses élèves
- Validation des justificatifs déposés par les parents
- Convocation parents pour les dossiers de son périmètre
- Application de sanctions (retenues, exclusions temporaires)

### Emploi du temps (sur scope)
- Lecture EDT des classes de son scope
- Propositions d'ajustement (validées par le directeur)

### Communication
- Messagerie avec parents et enseignants de son périmètre
- Annonces ciblées sur ses classes

**Restrictions** : aucun accès aux classes hors scope, aux finances, ni aux inscriptions.

---

## 5. Enseignant

**Rôle** : acteur de la salle de classe, en relation directe avec élèves et parents.

### Saisie des notes
- Création d'évaluations (devoir maison, interrogation, examen) avec coefficient
- Saisie en grille type tableur, sauvegarde automatique
- Import CSV pour évaluations massives
- Mode brouillon avant publication
- Statistiques par classe : moyenne, médiane, écart-type, distribution
- Verrouillage automatique après clôture de période

### Vie scolaire
- Appel numérique en début de séance (présent / absent / retard / exclu)
- Saisie de sanctions : avertissement, retenue, mot dans le carnet
- Réception et validation/refus des justificatifs déposés par les parents
- Historique des incidents par élève

### Carnet de liaison
- Émission d'entrées : information, autorisation, convocation, mot personnel
- Suivi des accusés de lecture / signatures parents
- Réponse aux justifications déposées
- Pièces jointes (photos, documents)

### Devoirs à publier
- Création de devoirs (titre, description, pièces jointes, date à rendre, classe(s) concernée(s))
- Suivi des rendus : qui a déposé, qui n'a pas déposé
- Correction et retour individuel à l'élève
- Notation directement liée à une évaluation

### Commentaires & échanges parents
- Messagerie scopée à *ses* élèves uniquement (parents et élèves de ses classes)
- Saisie d'appréciations par matière sur le bulletin
- Si prof principal : appréciation générale du bulletin
- Acceptation et proposition de créneaux de rendez-vous parent-prof

### Mon emploi du temps
- Vue personnelle de l'EDT de la semaine
- Notifications de changements (remplacements, déplacements de cours)

### Mon profil
- Mise à jour des coordonnées
- Préférences de notifications

---

## 6. Parent

**Rôle** : suivi de la scolarité de son ou ses enfants.

### Vue académique
- Notes en temps réel à chaque saisie publiée
- Bulletins publiés (consultation et téléchargement PDF)
- Devoirs à venir et historique
- Feedback et corrections des enseignants
- Emploi du temps de l'enfant
- Alertes en cas de changement (cours déplacé, remplacement)

### Vie scolaire
- Absences, retards, sanctions visibles en temps réel
- **Carnet de liaison** :
  - Lecture des entrées
  - Accusé de réception obligatoire
  - Signature électronique pour les autorisations
  - Dépôt de justificatif d'absence avec pièce jointe
- Convocations : date, motif, accusé de réception, prise de RDV

### Échanges
- Messagerie avec les enseignants de l'enfant
- Demande de rendez-vous (parent-prof, parent-direction)
- Réception des annonces de l'école (push notifications, email)

### Finances
- Échéancier de scolarité par enfant (à payer / payé / en retard)
- Paiement en ligne : Mobile Money, Wave, carte bancaire
- Reçus PDF téléchargeables
- Historique complet des transactions
- Téléchargement d'attestations : scolarité, paiement, bulletin

### Multi-enfants
- Sélecteur d'enfant si plusieurs scolarisés (potentiellement dans des écoles différentes)
- Vue consolidée des notifications pour tous les enfants

### Profil
- Coordonnées d'urgence (numéros, email)
- Personnes autorisées à récupérer l'enfant
- Préférences de notifications par canal et par type d'événement

---

## Matrice transversale

Légende : **R** = lecture, **RW** = lecture + écriture, **—** = pas d'accès. Le scope est précisé entre parenthèses.

| Module | Fondateur | Gestionnaire | Directeur | Censeur | Enseignant | Parent |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Dashboard global multi-écoles | R | — | — | — | — | — |
| Finances / facturation | R | RW | R | — | — | R (siennes) |
| Inscriptions / réinscriptions | R | RW | R | R (scope) | — | — |
| Création comptes personnel | R | RW | RW (prof) | — | — | — |
| Classes & affectations | R | RW | RW | R (scope) | R (siennes) | R (enfant) |
| Emploi du temps | R | RW | RW | R + propose | R (sien) | R (enfant) |
| Saisie & gestion des notes | R | R | R | R (scope) | RW (siennes) | R (enfant) |
| Validation & publication bulletin | R | R | RW | RW (scope) | — | R (enfant) |
| Vie scolaire (absences, sanctions) | R | R | RW | RW (scope) | RW (siennes) | R + justifie |
| Carnet de liaison | R | R | RW | RW (scope) | RW (siennes) | R + signe |
| Devoirs | R | R | R | R (scope) | RW | R (enfant) |
| Messagerie | — | RW (école) | RW (école) | RW (scope) | RW (ses parents) | RW (profs enfant) |
| Annonces école | R | RW | RW | RW (scope) | — | R |
| Convocations & RDV | R | RW | RW | RW (scope) | RW (siennes) | R + accepte |
| Audit trail | R | R (école) | R (école) | — | — | — |
| Paramétrage pédagogique (barème, coef) | R | RW | R | — | — | — |
| Calendrier scolaire | R | RW | R | R | R | R |

---

## Décisions ouvertes

À trancher avant de figer le modèle :

1. **Sens du rôle "Censeur"** : directeur adjoint pédagogique, ou surveillant général (vie scolaire/discipline) au sens d'Afrique francophone ?
2. **Fondateur** : compte unique ou rôle multi-utilisateurs (investisseurs) ?
3. **Élève** : rôle ajouté en v1 ou repoussé en v2 ?
4. **Comptable** : sous-rôle séparé du gestionnaire (focus finances) ?
5. **Prof principal** : sous-rôle de l'enseignant pouvant éditer l'appréciation générale du bulletin ?

---

*Document évolutif — toute modification doit être discutée et tracée dans le changelog du projet.*
