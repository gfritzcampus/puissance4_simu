# Simulateur de Puissance 4

Ce simulateur permet au choix :
- de simuler la carte de gestion du panneau led et controlleurs (partie IHM)
- de simuler la carte de gestion de jeu (partie core)

## Prérequis

Pour faire fonctionner le simulateur, il faut:
- nodejs (testé avec node v10.18.0)
- npm
- les droits d'accès au port série

```bash
# Pour Debian et dérivé
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential
```

## Installation

Première installation

```bash
npm install
```

## Démarrage

Pour démarrer le serveur, en utilisant le port par défaut (3000) :

```bash
npm start
```

Pour choisir un autre port :

```bash
npm start -- --port 4000
```

Pour laisser le simulateur choisir un port disponible automatiquement

```bash
npm start -- --port 0
```

Une fois le serveur démarrer, il faut lancer un navigateur web, et se rendre sur la page http://localhost:3000 (dans le cas
ou le port par défaut est utilisé)
