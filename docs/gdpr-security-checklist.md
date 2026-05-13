# Checklist GDPR / sécurité finale — LocalFood

## Objectif

Cette checklist résume l’état GDPR / sécurité avant ouverture publique de LocalFood.

Elle ne remplace pas un avis juridique professionnel, mais permet de suivre les points techniques et organisationnels confirmés.

## État actuel

| Point | État | Commentaire |
|---|---|---|
| Mentions légales | Fait partiellement | Page accessible, mais placeholders [***] à compléter avant vraie prod. |
| Politique de confidentialité | Fait partiellement | Page accessible, mais placeholders [***] à compléter avant vraie prod. |
| CGU | Fait partiellement | Page accessible, mais placeholders [***] à compléter avant vraie prod. |
| CGV | Fait partiellement | Page accessible, mais dépend encore du modèle commercial final. |
| Politique cookies | Fait partiellement | Page accessible, mais placeholders [***] à compléter avant vraie prod. |
| Bandeau cookies | Fait | Bandeau actif avec accepter, refuser, personnaliser. |
| Cookies analytics / marketing | Non actifs confirmés | Aucun analytics/pixel confirmé à ce stade. |
| Export des données utilisateur | Manquant | Aucune fonctionnalité dédiée trouvée. À gérer manuellement au départ ou à développer. |
| Suppression de compte | Manquant | Aucune fonctionnalité dédiée trouvée. À gérer manuellement au départ ou à développer. |
| security.txt | Manquant | À ajouter quand l’email de contact sécurité officiel est décidé. |
| Backup PostgreSQL | Fait | Backups LocalFood présents et dump lisible avec pg_restore --list. |
| Restauration complète testée | À faire | Une restauration complète en base de test reste recommandée. |

## Routes légales testées

Routes à vérifier avant ouverture :

- /legal/mentions-legales
- /legal/confidentialite
- /legal/cgu
- /legal/cgv
- /legal/cookies

Test rapide :

    curl -I http://152.228.129.17/legal/mentions-legales
    curl -I http://152.228.129.17/legal/confidentialite
    curl -I http://152.228.129.17/legal/cgu
    curl -I http://152.228.129.17/legal/cgv
    curl -I http://152.228.129.17/legal/cookies

## Export des données utilisateur

État actuel : non implémenté.

Décision provisoire possible au lancement :

- traiter les demandes manuellement par email ;
- identifier l’utilisateur concerné ;
- exporter depuis PostgreSQL les données liées à son email / profil / entreprise ;
- fournir une copie lisible au demandeur.

À développer plus tard si le volume d’utilisateurs augmente :

- route admin d’export utilisateur ;
- export JSON/CSV ;
- journalisation de la demande.

## Suppression de compte

État actuel : non implémenté.

Décision provisoire possible au lancement :

- traiter les demandes manuellement par email ;
- désactiver ou supprimer le compte selon le cas ;
- conserver uniquement les données légalement nécessaires ;
- documenter l’action effectuée.

À développer plus tard :

- bouton de demande de suppression ;
- workflow admin ;
- anonymisation des données historiques si nécessaire.

## security.txt

État actuel : absent.

À créer dans :

    public/.well-known/security.txt

Exemple de contenu futur :

    Contact: mailto:security@domaine-officiel.example
    Preferred-Languages: fr, en
    Canonical: https://domaine-officiel.example/.well-known/security.txt

Ne pas publier ce fichier avec une adresse personnelle si l’objectif est de garder cette adresse privée.

## Points bloquants avant vraie prod publique

Avant une vraie prod publique, compléter :

1. Remplacer tous les placeholders [***] dans les pages légales.
2. Décider un email officiel de contact.
3. Décider si export/suppression utilisateur restent manuels au lancement ou doivent être développés.
4. Ajouter security.txt avec le bon domaine/email.
5. Tester une restauration complète PostgreSQL dans une base de test.
6. Mettre à jour la politique cookies si analytics, pixels, Stripe ou cookies auth sont ajoutés.

## Statut

Point 88 audité.

Le site peut être préparé pour une ouverture limitée, mais il ne faut pas présenter l’état actuel comme conformité GDPR finale complète tant que les placeholders légaux, l’export/suppression utilisateur et security.txt ne sont pas traités.
