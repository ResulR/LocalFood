# Procédure de rollback — LocalFood

## Objectif

Ce document explique comment revenir en arrière après un mauvais déploiement LocalFood.

Il couvre deux cas :

1. rollback code ;
2. rollback base de données PostgreSQL depuis un dump.

Projet : LocalFood  
Chemin VPS : /home/debian/apps/localfood  
Process PM2 concernés :

- localfood-web
- localfood-api

Attention : ne pas toucher à pasta-house-server pendant un rollback LocalFood.

## Règles importantes

Avant tout rollback :

- rester dans le bon dossier ;
- identifier précisément ce qui est cassé ;
- ne pas modifier .env à l’aveugle ;
- ne pas afficher de secret ;
- ne pas restaurer une DB sans être sûr du dump ;
- si possible, faire un backup de l’état actuel avant restauration DB.

Dossier projet :

    cd /home/debian/apps/localfood

Vérifier l’état Git :

    git status

Vérifier PM2 :

    pm2 status

## 1. Rollback simple du code avec git revert

Méthode recommandée si le mauvais changement a déjà été push.

Afficher les derniers commits :

    cd /home/debian/apps/localfood
    git log --oneline -10

Créer un commit inverse du mauvais commit :

    git revert <commit_sha>

Puis rebuild :

    npm run build

    cd server
    npm run build

    cd ..

Redémarrer/recharger PM2 :

    pm2 restart localfood-web --update-env
    pm2 reload localfood-api

Tester :

    curl -I http://127.0.0.1:3000
    curl -I http://152.228.129.17
    curl -i http://152.228.129.17/api/health

Si tout est OK :

    git push

## 2. Rollback temporaire avec git reset --hard

À utiliser seulement si le commit n’a pas besoin d’être conservé localement ou en urgence.

Attention : cette commande supprime les modifications locales non commit.

Afficher les commits :

    cd /home/debian/apps/localfood
    git log --oneline -10

Revenir au commit précédent :

    git reset --hard HEAD~1

Ou revenir à un commit précis :

    git reset --hard <commit_sha>

Rebuild :

    npm run build

    cd server
    npm run build

    cd ..

Redémarrer/recharger PM2 :

    pm2 restart localfood-web --update-env
    pm2 reload localfood-api

Tester :

    curl -I http://127.0.0.1:3000
    curl -I http://152.228.129.17
    curl -i http://152.228.129.17/api/health

## 3. Vérifier les logs en cas d’erreur

Logs frontend :

    pm2 logs localfood-web --lines 80 --nostream

Logs API :

    pm2 logs localfood-api --lines 100 --nostream

Si le frontend répond 502 juste après restart, attendre quelques secondes puis retester :

    sleep 3
    curl -I http://152.228.129.17

## 4. Rollback DB — vérifier les dumps disponibles

Les backups PostgreSQL LocalFood sont dans :

    /var/backups/localfood

Lister les backups :

    sudo ls -lah /var/backups/localfood

Vérifier le dernier dump :

    sudo bash -lc 'latest=$(ls -t /var/backups/localfood/*.dump | head -1); echo "$latest"; pg_restore --list "$latest" | head -40'

Le dump doit afficher les tables LocalFood, par exemple :

- restaurants
- profiles
- companies
- local_auth_users
- restaurant_photos
- restaurant_reviews
- restaurant_offers

## 5. Faire un backup de sécurité avant restauration DB

Avant de restaurer un ancien dump, créer un backup de l’état actuel :

    cd /home/debian/apps/localfood
    sudo ./infra/scripts/pg_backup_localfood.sh
    sudo ls -lah /var/backups/localfood

Cela permet de revenir à l’état juste avant rollback si nécessaire.

## 6. Restaurer la DB dans une base de test d’abord

Recommandé avant toute restauration sur la base réelle.

Créer une base de test :

    sudo -u postgres createdb localfood_restore_test -O localfood_user

Restaurer le dump dans la base de test :

    sudo -u postgres pg_restore \
      --clean \
      --if-exists \
      --no-owner \
      --dbname=localfood_restore_test \
      /var/backups/localfood/<backup_file>.dump

Vérifier rapidement :

    sudo -u postgres psql localfood_restore_test -c "select count(*) from public.restaurants;"

Supprimer la base de test après validation :

    sudo -u postgres dropdb localfood_restore_test

## 7. Restaurer la DB réelle depuis un dump

À faire seulement si :

- le dump a été vérifié avec pg_restore --list ;
- un backup de sécurité récent a été créé ;
- la restauration en base de test a été validée si possible ;
- on accepte de remplacer l’état actuel de la base.

Stopper temporairement l’API pour éviter les écritures pendant restauration :

    pm2 stop localfood-api

Restaurer :

    sudo -u postgres pg_restore \
      --clean \
      --if-exists \
      --no-owner \
      --dbname=localfood \
      /var/backups/localfood/<backup_file>.dump

Relancer l’API :

    pm2 start localfood-api

Tester :

    curl -i http://152.228.129.17/api/health
    curl -sS http://152.228.129.17/api/public/restaurants | python3 -m json.tool | head -80

## 8. Si DATABASE_URL est nécessaire

Ne jamais afficher le contenu complet de server/.env.

Charger les variables :

    cd /home/debian/apps/localfood
    set -a
    . server/.env
    set +a

Tester :

    psql "$DATABASE_URL" -c "select now();"

## 9. Après rollback

Toujours vérifier :

    pm2 status
    curl -I http://127.0.0.1:3000
    curl -I http://152.228.129.17
    curl -I http://152.228.129.17/restaurants
    curl -I http://152.228.129.17/restaurants/maison-zayna
    curl -i http://152.228.129.17/api/health
    git status

## 10. Notes importantes

- Le rollback code et le rollback DB sont deux opérations différentes.
- Ne pas restaurer la DB si le problème vient uniquement du frontend.
- Ne pas faire git reset --hard s’il existe des modifications locales utiles non commit.
- Ne pas toucher à pasta-house-server.
- Les backups DB ne sauvegardent pas les uploads, les fichiers .env, Nginx ou PM2.
- Une restauration complète dans une base de test reste à faire régulièrement pour valider les backups.
