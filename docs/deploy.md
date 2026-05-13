# Procédure de déploiement — LocalFood

## Objectif

Ce document décrit la procédure de déploiement du projet LocalFood sur le VPS OVH.

Projet : LocalFood
Chemin VPS : /home/debian/apps/localfood
Branche principale : main

## Services PM2

LocalFood utilise deux processus PM2 :

- localfood-api : backend Express / TypeScript / PostgreSQL
- localfood-web : frontend TanStack Start / Vite preview

Attention : le même VPS héberge aussi pasta-house-server.
Ne pas arrêter, supprimer ou modifier pasta-house-server pendant un déploiement LocalFood.

Commande de vérification :

    pm2 status

Les processus attendus sont :

- localfood-api : online
- localfood-web : online
- pasta-house-server : online

## Avant déploiement

Toujours commencer dans le bon dossier :

    cd /home/debian/apps/localfood

Vérifier Git :

    git status

État attendu avant un déploiement propre :

    nothing to commit, working tree clean

Ne jamais modifier .env à l’aveugle.
Ne jamais afficher le contenu complet de .env.
Ne jamais déployer si le build échoue.
Faire un backup PostgreSQL avant toute action DB importante.

## Récupérer le code

Depuis le dossier projet :

    cd /home/debian/apps/localfood
    git pull origin main
    git status

## Installer les dépendances si nécessaire

Si package-lock.json a changé :

    cd /home/debian/apps/localfood
    npm ci

Si server/package-lock.json a changé :

    cd /home/debian/apps/localfood/server
    npm ci

Si aucune dépendance n’a changé, cette étape peut être inutile.

## Build frontend

    cd /home/debian/apps/localfood
    npm run build

Le build doit se terminer sans erreur.

## Build backend

    cd /home/debian/apps/localfood/server
    npm run build

Le build TypeScript backend doit se terminer sans erreur.

## Redémarrer ou recharger PM2

Frontend :

    pm2 restart localfood-web --update-env

API :

    pm2 reload localfood-api

Si des variables d’environnement API ont changé :

    pm2 reload localfood-api --update-env

Après un restart web, un court 502 peut apparaître pendant quelques secondes.
Attendre puis retester avant de conclure que le site est cassé.

## Tests post-déploiement

Vérifier PM2 :

    pm2 status

Tester le frontend local :

    curl -I http://127.0.0.1:3000

Tester le site public via IP :

    curl -I http://152.228.129.17
    curl -I http://152.228.129.17/restaurants
    curl -I http://152.228.129.17/restaurants/maison-zayna
    curl -I http://152.228.129.17/login

Tester l’API :

    curl -i http://152.228.129.17/api/health

Réponse attendue :

    ok: true
    service: localfood-api
    db: ok

Une route protégée peut répondre 401 AUTH_TOKEN_MISSING sans token.
C’est normal.

Ne jamais afficher un token Bearer publiquement.

## Logs utiles

Logs frontend :

    pm2 logs localfood-web --lines 60 --nostream

Logs API :

    pm2 logs localfood-api --lines 80 --nostream

Si le site répond 502 juste après un restart frontend :

    pm2 status
    pm2 logs localfood-web --lines 80 --nostream
    sleep 3
    curl -I http://152.228.129.17

## Backup avant action DB

Avant toute modification importante en base :

    cd /home/debian/apps/localfood
    sudo ./infra/scripts/pg_backup_localfood.sh
    sudo ls -lah /var/backups/localfood

Vérifier le dernier dump :

    sudo bash -lc 'latest=$(ls -t /var/backups/localfood/*.dump | head -1); echo "$latest"; pg_restore --list "$latest" | head -40'

Le backup LocalFood sauvegarde la base PostgreSQL.
Il ne sauvegarde pas automatiquement les uploads, les .env, Nginx ou PM2.

## Utiliser psql avec DATABASE_URL

Ne pas afficher le contenu complet de server/.env.

Pour charger les variables localement :

    cd /home/debian/apps/localfood
    set -a
    . server/.env
    set +a

Tester la connexion :

    psql "$DATABASE_URL" -c "select now();"

## Rollback simple

Afficher les derniers commits :

    cd /home/debian/apps/localfood
    git log --oneline -5

Rollback temporaire vers le commit précédent :

    git reset --hard HEAD~1
    npm run build
    cd server
    npm run build
    cd ..
    pm2 restart localfood-web --update-env
    pm2 reload localfood-api

Attention : ne pas utiliser git reset --hard s’il y a des modifications locales non sauvegardées.

## Checklist rapide

    cd /home/debian/apps/localfood
    git status
    git pull origin main
    npm run build
    cd server
    npm run build
    cd ..
    pm2 restart localfood-web --update-env
    pm2 reload localfood-api
    sleep 3
    pm2 status
    curl -I http://127.0.0.1:3000
    curl -I http://152.228.129.17
    curl -i http://152.228.129.17/api/health

## Notes importantes

Le domaine officiel LocalFood n’est pas encore confirmé dans cette procédure.
La pré-production séparée a été reportée volontairement.
Une restauration complète dans une base de test reste à faire plus tard pour valider la stratégie backup de bout en bout.
