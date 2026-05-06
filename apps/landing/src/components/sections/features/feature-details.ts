/**
 * Données détaillées pour chaque fonctionnalité.
 * Chaque entrée correspond au `title` exact d'une feature dans FeaturesSection.
 * Sources : analyse directe du code API (routes, schemas Zod, Prisma models)
 * et des pages frontend (apps/web/src/app/restaurant/*).
 */

export type FeatureDetail = {
  caption: string
  highlights: { label: string; value: string }[]
  sections: {
    title: string
    items: string[]
  }[]
}

export const featureDetails: Record<string, FeatureDetail> = {
  /* ═══════════════════════════════════════════════════
   *  TAB: RESTAURANTS
   * ═══════════════════════════════════════════════════ */

  'Menu & Produits': {
    caption: 'Gestion complète du catalogue produit avec variantes, modificateurs, allergènes et suivi de stock intégré.',
    highlights: [
      { label: 'Champs produit', value: '25+' },
      { label: 'Variantes', value: 'Multi-niveaux' },
    ],
    sections: [
      {
        title: 'Produits',
        items: [
          'Nom, description et traduction anglaise',
          'Prix de vente, prix barré et prix de revient',
          'Galerie multi-images avec image principale',
          'SKU, code-barres, calories, allergènes et tags diététiques',
          'Temps de préparation configurable par produit',
          'Slug auto-généré pour le SEO du site vitrine',
          'Duplication en un clic (variantes et modificateurs inclus)',
        ],
      },
      {
        title: 'Variantes & Modificateurs',
        items: [
          'Variantes indépendantes (taille, format) avec prix et stock propres',
          'Groupes de modificateurs : RADIO (1 choix) ou CHECKBOX (multi)',
          'Min/max sélections par groupe, option par défaut',
          'Supplément prix par modificateur',
          'Tri par drag & drop (sortOrder)',
        ],
      },
      {
        title: 'Catégories',
        items: [
          'Catégories et sous-catégories hiérarchiques',
          'Image, nom traduit (EN) et description',
          'Tri personnalisé, activation/désactivation',
        ],
      },
      {
        title: 'Inventaire intégré',
        items: [
          'Suivi de stock activable par produit/variante',
          'Alerte de stock bas configurable',
          'Liaison directe avec les recettes (coût matière)',
        ],
      },
    ],
  },

  'Commandes en temps réel': {
    caption: "Pipeline de commandes complet avec 7 statuts, filtres avancés, notifications sonores et refetch automatique.",
    highlights: [
      { label: 'Statuts', value: '7 étapes' },
      { label: 'Refetch', value: '30s auto' },
    ],
    sections: [
      {
        title: 'Pipeline de statuts',
        items: [
          'PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → COMPLETED',
          'CANCELLED et REFUNDED avec raison obligatoire',
          'Changement de statut avec modale de confirmation',
          'Permissions : annulation réservée aux rôles autorisés',
        ],
      },
      {
        title: 'Tableau de bord',
        items: [
          'Compteurs temps réel : total, en attente, en cours, CA du jour',
          'Vue desktop (tableau) et mobile (cartes)',
          'Recherche par numéro de commande ou nom client',
          'Filtres par statut (7) et type de service (3)',
          'Pagination configurable : 10, 20, 50, 100 par page',
        ],
      },
      {
        title: 'Détail commande',
        items: [
          'Panel latéral avec articles, modificateurs et notes',
          'Méthodes de paiement : Espèces, CB, CB en ligne, Apple Pay, Google Pay',
          'Statut de paiement : 7 états (Pending → Refunded)',
          'Numéro affiché avec préfixe personnalisable par restaurant',
          'Copie rapide du numéro de commande',
        ],
      },
      {
        title: 'Types de service',
        items: [
          'Livraison (DELIVERY)',
          'À emporter (PICKUP)',
          'Sur place (DINE_IN)',
        ],
      },
    ],
  },

  'Livraison & Zones': {
    caption: "Gestion complète de la livraison : 10 statuts de suivi, livreurs avec notes, assignation et GPS.",
    highlights: [
      { label: 'Statuts livraison', value: '10' },
      { label: 'Refresh', value: '15s (livreur)' },
    ],
    sections: [
      {
        title: 'Suivi en temps réel',
        items: [
          '10 statuts : PENDING → ASSIGNED → DRIVER_EN_ROUTE → AT_RESTAURANT → PICKED_UP → EN_ROUTE → ARRIVED → DELIVERED',
          'États erreur : FAILED et CANCELLED',
          'Refresh automatique toutes les 15s (vue livreur) et 30s (vue restaurant)',
          'Lien Google Maps intégré pour la navigation',
        ],
      },
      {
        title: 'Zones de livraison',
        items: [
          'Définition par rayon (km) ou polygone',
          'Tarification de livraison par zone',
          'Montant minimum de commande par zone',
          'Activation/désactivation par zone',
        ],
      },
      {
        title: 'Gestion des livreurs',
        items: [
          'Profil livreur avec nom, téléphone, avatar et type de véhicule',
          'Système de notes et avis clients (étoiles)',
          'Statistiques livreur : livraisons jour/semaine/total, note moyenne',
          'Assignation depuis le panneau détail de la livraison',
          'Vue dédiée livreur avec livraison en cours et historique',
        ],
      },
      {
        title: 'Workflow livreur',
        items: [
          'Boutons contextuels : "En route vers le restaurant" → "Arrivé" → "Récupéré" → "En livraison" → "Livré"',
          "Blocage si la commande n'est pas encore prête (ORDER_NOT_READY)",
          "Option 'Échouée' disponible uniquement à l'arrivée chez le client",
        ],
      },
    ],
  },

  'Caisse POS': {
    caption: "Interface de caisse tactile complète avec panier, tables ouvertes, remises, sélection client et reçus.",
    highlights: [
      { label: 'Modes paiement', value: '5+' },
      { label: 'Actions', value: 'Ouvrir / Clôturer' },
    ],
    sections: [
      {
        title: 'Interface de vente',
        items: [
          'Grille produits par catégorie avec onglets',
          'Recherche instantanée dans le catalogue',
          'Ajout rapide si pas de variante/modificateur',
          'Modale de personnalisation (variantes + modificateurs)',
          'Pagination produits (15 par page)',
          'Responsive : sidebar desktop, drawer mobile',
        ],
      },
      {
        title: 'Panier & Commande',
        items: [
          'Panier avec quantités, notes par article et modificateurs',
          'Sélection du type de service : Livraison, Emporter, Sur place',
          'Numéro de table pour le service sur place',
          'Sélection de client existant (fidélité automatique)',
          'Application de remises (%, montant fixe) avec raison et code promo',
        ],
      },
      {
        title: 'Commandes ouvertes (Tables)',
        items: [
          'Créer une commande "ouverte" sans paiement immédiat',
          'Panneau des tables ouvertes avec articles et total',
          'Ajouter des articles à une commande existante',
          'Clôturer avec choix du mode de paiement et rendu monnaie',
          'Mode édition avec bandeau visuel et annulation possible',
        ],
      },
      {
        title: 'Paiement & Reçus',
        items: [
          'Modes : Espèces, CB, CB en ligne, Apple Pay, Google Pay',
          'Calcul du rendu monnaie automatique',
          'Écran de confirmation post-paiement',
          'Reçus avec ID pour réimpression',
          'Email du reçu au client si adresse renseignée',
        ],
      },
    ],
  },

  'Inventaire & Stock': {
    caption: "Gestion fournisseurs, ingrédients, recettes et mouvements de stock avec traçabilité complète.",
    highlights: [
      { label: 'Modules', value: '4 (Ingrédients, Recettes, Fournisseurs, Mouvements)' },
      { label: 'Unités', value: 'Personnalisables' },
    ],
    sections: [
      {
        title: 'Ingrédients',
        items: [
          'Catalogue avec nom, unité de mesure et catégorie',
          'Stock actuel et seuil de stock bas',
          'Prix de référence (coût unitaire)',
          'Alerte automatique quand le stock passe sous le seuil',
        ],
      },
      {
        title: 'Recettes',
        items: [
          'Recette liée à un produit du menu',
          'Liste des ingrédients avec quantités requises',
          'Calcul automatique du coût matière',
          'Déduction de stock à la vente si activé',
        ],
      },
      {
        title: 'Fournisseurs',
        items: [
          'Fiche fournisseur : nom, email, téléphone, adresse',
          'Association aux ingrédients fournis',
          'Historique des commandes fournisseur',
        ],
      },
      {
        title: 'Mouvements de stock',
        items: [
          'Types : Entrée, Sortie, Ajustement, Transfert',
          'Référence, notes et date de mouvement',
          'Traçabilité complète : qui, quand, combien',
          'Filtrage et recherche dans historique',
        ],
      },
    ],
  },

  'Clients & Fidélité': {
    caption: "Base CRM restaurant avec fidélité par points, bonus bienvenue/anniversaire, parrainage et tags.",
    highlights: [
      { label: 'Bonus', value: '3 types' },
      { label: 'Segmentation', value: 'Tags + Rules' },
    ],
    sections: [
      {
        title: 'Fiches clients',
        items: [
          'Profil complet : nom, email, téléphone, adresses',
          'Historique des commandes avec montants',
          'Nombre total de commandes et CA généré',
          'Tags personnalisés pour la segmentation',
          'Notes internes par client',
        ],
      },
      {
        title: 'Programme de fidélité',
        items: [
          'Points par euro/franc dépensé (ratio configurable)',
          'Seuil de récompense et valeur de la récompense',
          'Bonus de bienvenue (points offerts à inscription)',
          "Bonus d'anniversaire automatique",
          'Historique des points gagnés et utilisés',
        ],
      },
      {
        title: 'Parrainage',
        items: [
          'Code de parrainage unique par client',
          'Bonus pour le parrain et le filleul',
          'Suivi des parrainages réalisés',
        ],
      },
      {
        title: 'Segmentation & Tags',
        items: [
          "Rules de tags automatiques (ex: 'VIP' après 10 commandes)",
          'Tags manuels libres',
          'Filtrage clients par tag pour le ciblage marketing',
        ],
      },
    ],
  },

  'Marketing & Promotions': {
    caption: "Suite marketing complète : coupons, promotions (5 types), avis clients, campagnes email ciblées.",
    highlights: [
      { label: 'Types promo', value: '5 (Discount, Happy Hour, Bundle, BOGO, Free Delivery)' },
      { label: 'Avis', value: '3 sous-notes (Food, Service, Delivery)' },
    ],
    sections: [
      {
        title: 'Coupons',
        items: [
          'Code promo avec validation unique par restaurant',
          'Types : pourcentage, montant fixe, article offert',
          'Montant minimum de commande requis',
          'Plafond de réduction (maxDiscount)',
          'Limites : max utilisations totales et par client',
          'Application sur tout / produits spécifiques / catégories',
          'Dates de validité avec activation/désactivation',
        ],
      },
      {
        title: 'Promotions',
        items: [
          '5 types : DISCOUNT, HAPPY_HOUR, BUNDLE, BOGO, FREE_DELIVERY',
          'Jours actifs configurables (lundi → dimanche)',
          'Plage horaire active (ex: 12h-14h pour Happy Hour)',
          'Ciblage par produits ou catégories',
        ],
      },
      {
        title: 'Avis clients',
        items: [
          'Note globale + 3 sous-notes : Food, Service, Delivery',
          'Distribution des notes (1 à 5 étoiles)',
          'Modération : publié / masqué',
          'Réponse du restaurateur avec timestamp',
          'Filtrage par note et statut (en attente de réponse)',
          'Avis vérifiés (liés à une commande)',
        ],
      },
      {
        title: 'Campagnes email',
        items: [
          'Ciblage par règles (targeting rules) : tags, dernière commande, etc.',
          'Estimation du nombre de destinataires avant envoi',
          'Statuts : DRAFT → SCHEDULED → SENDING → SENT',
          'Stats : envoyés, ouverts, cliqués',
        ],
      },
    ],
  },

  'Site personnalisable': {
    caption: "Site de commande en ligne complet : thèmes, bannières, pages custom, SEO, domaine, horaires.",
    highlights: [
      { label: 'SEO', value: 'Meta title, desc, OG' },
      { label: 'Domaine', value: 'Sub + Custom' },
    ],
    sections: [
      {
        title: 'Apparence',
        items: [
          'Galerie de thèmes prêts à utiliser',
          'Couleur primaire, police et arrondis personnalisables',
          'Bannières promotionnelles (image + lien)',
          'Logo et favicon custom',
        ],
      },
      {
        title: 'Contenu',
        items: [
          'Pages personnalisées : À propos, Contact, CGV, etc.',
          'Éditeur de contenu riche',
          'Horaires du restaurant par jour de la semaine',
          'Message de fermeture temporaire',
          "Info de contact : email, téléphone, adresse, lien Google Maps",
        ],
      },
      {
        title: 'SEO & Domaine',
        items: [
          'Meta title et meta description par restaurant',
          'Image Open Graph pour les partages sociaux',
          'Sous-domaine gratuit : monresto.izirestau.com',
          'Domaine personnalisé avec vérification DNS et SSL',
          'Slug de restaurant unique',
        ],
      },
      {
        title: 'Configuration',
        items: [
          'Préfixe de commande personnalisable',
          'Devise du restaurant',
          'Acceptation automatique des commandes',
          'Montant minimum de commande',
          'Modes de paiement en ligne activables',
          'Réseaux sociaux (Facebook, Instagram, WhatsApp)',
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════
   *  TAB: REVENDEURS
   * ═══════════════════════════════════════════════════ */

  'Dashboard analytique': {
    caption: "Vue temps réel de votre activité : revenus, restaurants actifs, croissance et KPIs opérationnels.",
    highlights: [
      { label: 'Données', value: 'Temps réel' },
      { label: 'Export', value: 'CSV / PDF' },
    ],
    sections: [
      {
        title: 'KPIs principaux',
        items: [
          'Revenus total et par période',
          'Nombre de restaurants actifs / inactifs',
          'Nombre de souscriptions actives',
          'Taux de churn et rétention',
          'Dernières inscriptions',
        ],
      },
      {
        title: 'Graphiques',
        items: [
          'Courbe de revenus mensuel',
          'Répartition des plans souscrits',
          'Évolution du nombre de clients',
          'Filtre par période (7j, 30j, 90j, 1an)',
        ],
      },
    ],
  },

  'Gestion des restaurants': {
    caption: "Créez, configurez et gérez les sites de vos clients restaurateurs avec domaines et statuts.",
    highlights: [
      { label: 'Création', value: 'En 1 clic' },
      { label: 'Domaines', value: 'Sub + Custom' },
    ],
    sections: [
      {
        title: 'Cycle de vie',
        items: [
          'Création avec nom, slug et informations de base',
          'Attribution automatique de sous-domaine',
          'Activation / suspension / archivage',
          'Dates de publication et dernière modification',
        ],
      },
      {
        title: 'Configuration par restaurant',
        items: [
          'Informations : nom, adresse, téléphone, email',
          'Horaires, devise, modes de paiement',
          'Domaine personnalisé optionnel',
          'Association au plan tarifaire du revendeur',
        ],
      },
    ],
  },

  'Licences & Abonnements': {
    caption: "Gestion des souscriptions avec période trial, renouvellement automatique et suivi des paiements.",
    highlights: [
      { label: 'Trial', value: 'Configurable' },
      { label: 'Billing', value: 'Automatisé' },
    ],
    sections: [
      {
        title: 'Souscriptions',
        items: [
          'Liaison client → plan → restaurant',
          'Période trial gratuite configurable',
          "Statuts : ACTIVE, TRIALING, PAST_DUE, CANCELLED, EXPIRED",
          'Date de début, fin et prochaine facturation',
          'Renouvellement automatique ou manuel',
        ],
      },
      {
        title: 'Suivi financier',
        items: [
          'Historique des paiements par client',
          'Montant du plan et devise',
          'Détection des impayés (PAST_DUE)',
          'Suspension automatique si non-paiement',
        ],
      },
    ],
  },

  'CRM & Facturation': {
    caption: "Pipeline complet : leads, clients actifs, interactions multi-types, factures et paiements auto.",
    highlights: [
      { label: 'Pipeline', value: '4 statuts' },
      { label: 'Interactions', value: '5 types' },
    ],
    sections: [
      {
        title: 'Pipeline clients',
        items: [
          'Statuts : LEAD → PROSPECT → ACTIVE → CHURNED',
          'Fiche client : nom, email, téléphone, entreprise',
          'Source du lead (site vitrine, référé, import)',
          'Notes internes et tags',
        ],
      },
      {
        title: 'Interactions',
        items: [
          '5 types : NOTE, CALL, EMAIL, MEETING, OTHER',
          'Horodatage et auteur automatiques',
          'Historique chronologique complet',
          'Recherche dans les interactions',
        ],
      },
      {
        title: 'Facturation',
        items: [
          'Factures liées aux souscriptions',
          'Statut de paiement par facture',
          'Montant, devise et date',
          'Rappels automatiques pour impayés',
        ],
      },
    ],
  },

  'Plans tarifaires': {
    caption: "Créez vos plans de licence avec cycles personnalisés, mise en avant et archivage sécurisé.",
    highlights: [
      { label: 'Cycles', value: '1 à 36 mois' },
      { label: 'Visibilité', value: 'Public / Privé / Custom' },
    ],
    sections: [
      {
        title: 'Configuration',
        items: [
          'Nom, description et slug auto-généré',
          'Prix en devise configurable (EUR, XOF, etc.)',
          'Cycle de facturation : 1 à 36 mois',
          'Label de cycle personnalisable (ex: "Semestre")',
        ],
      },
      {
        title: 'Options avancées',
        items: [
          'Plan custom (visible seulement pour certains clients)',
          'Plan populaire (mis en avant sur la vitrine)',
          'Public / privé toggle',
          'Tri personnalisé (sortOrder)',
          'Archivage sans suppression si des souscriptions existent',
          "Compteur d'abonnés par plan",
        ],
      },
    ],
  },

  'Vitrine publique': {
    caption: "Page de vente configurable avec 4 templates, 8 sections modulables, styles globaux et SEO.",
    highlights: [
      { label: 'Templates', value: '4 (Modern, Pro, Dynamic, Minimal)' },
      { label: 'Sections', value: '8 modules configurables' },
    ],
    sections: [
      {
        title: 'Templates & Styles',
        items: [
          '4 templates : modern, professional, dynamic, minimal',
          'Styles globaux : couleur primaire, police (5 choix), arrondis, espacement',
          'Style boutons : solid, outline, ghost',
          'Style cartes : flat, bordered, shadow, elevated',
        ],
      },
      {
        title: '8 sections configurables',
        items: [
          'Hero : titre, sous-titre, image/vidéo, stats, CTA configurable',
          "Produit : modules avec icône, titre, description — layout grid/list/tabs/accordion",
          'How it Works : étapes avec numérotation — layout horizontal/vertical/timeline',
          'Bénéfices : items avec icône — layout grid/cards/icons/alternating',
          'Pricing : lié aux plans réels, plan mis en avant, CTA texte custom',
          'Témoignages : nom, entreprise, citation, avatar, note — layout grid/carousel/large',
          'FAQ : question/réponse par catégorie — layout accordion/grid/categorized',
          'Contact : formulaire, infos, carte — activables indépendamment',
        ],
      },
      {
        title: 'SEO & Footer',
        items: [
          'Meta title et meta description',
          'Footer : badges de confiance (SSL, Support, etc.), liens, réseaux sociaux',
          'Copyright text personnalisable',
          'Réseaux sociaux : Facebook, Instagram, Twitter, LinkedIn, WhatsApp',
        ],
      },
    ],
  },

  'Domaine personnalisé': {
    caption: "Connectez votre propre domaine avec vérification DNS automatique et certificat SSL.",
    highlights: [
      { label: 'SSL', value: 'Automatique' },
      { label: 'DNS', value: 'Vérification TXT record' },
    ],
    sections: [
      {
        title: 'Configuration',
        items: [
          'Saisie du domaine custom (ex: commandes.monreseau.com)',
          'Génération du TXT record de vérification DNS',
          'Vérification automatique avec retour de statut',
          "Fallback sur domaine plateforme si non vérifié",
        ],
      },
      {
        title: 'SSL & Sécurité',
        items: [
          "Certificat SSL automatique après vérification DNS",
          'HTTPS forcé sur le domaine personnalisé',
          'Flag domainVerified en base de données',
          'Support de sous-domaines pour les clients restaurateurs',
        ],
      },
    ],
  },

  'Support intégré': {
    caption: "Système de tickets avec catégories, priorités, messages, notifications email et réouverture.",
    highlights: [
      { label: 'Catégories', value: '5 (Billing, Tech, Feature, Account, Other)' },
      { label: 'Priorités', value: '4 (Low → Urgent)' },
    ],
    sections: [
      {
        title: 'Tickets',
        items: [
          'Numéro unique auto-généré (TKT-XXX-XXX)',
          '5 catégories : BILLING, TECHNICAL, FEATURE_REQUEST, ACCOUNT, OTHER',
          '4 priorités : LOW, MEDIUM, HIGH, URGENT',
          'Statuts : OPEN → IN_PROGRESS → WAITING_REPLY → RESOLVED → CLOSED',
        ],
      },
      {
        title: 'Messagerie',
        items: [
          'Messages texte avec horodatage',
          "Identification de l'expéditeur (admin ou revendeur)",
          'Re-passage en IN_PROGRESS si réponse après WAITING_REPLY',
          "Compteur de messages par ticket",
        ],
      },
      {
        title: 'Notifications',
        items: [
          'Email automatique à la création du ticket (utilisateur + admin)',
          "Email à chaque nouveau message",
          'Fermeture et réouverture de ticket possibles',
          'Compteurs de tickets par statut dans le dashboard',
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════
   *  TAB: PLATEFORME
   * ═══════════════════════════════════════════════════ */

  'Multi-paiements': {
    caption: "3 providers de paiement intégrés nativement avec webhooks, remboursements et reçus.",
    highlights: [
      { label: 'Providers', value: '3 (Stripe, Moneroo, Paytech)' },
      { label: 'Webhooks', value: 'Confirmation auto' },
    ],
    sections: [
      {
        title: 'Providers',
        items: [
          'Stripe : marchés internationaux (EUR, USD, etc.)',
          'Moneroo : mobile money Afrique (Orange Money, Wave, etc.)',
          'Paytech : marchés West Africa (Sénégal, etc.)',
          'Configuration par revendeur (clés API dans les settings)',
        ],
      },
      {
        title: 'Processus',
        items: [
          'Création de session de paiement côté serveur',
          'Webhooks de confirmation automatique',
          'Statut de paiement synchronisé : PENDING → PAID → REFUNDED',
          'Gestion des remboursements partiels et totaux',
          'Reçus numériques avec ID unique',
        ],
      },
    ],
  },

  'Multi-devises': {
    caption: "Support de devises multiples au niveau plateforme, revendeur et restaurant.",
    highlights: [
      { label: 'Devises', value: 'EUR, XOF, + custom' },
      { label: 'Granularité', value: 'Par entité' },
    ],
    sections: [
      {
        title: 'Configuration',
        items: [
          "Devise par défaut de la plateforme",
          'Devise configurable par revendeur',
          'Devise indépendante par restaurant',
          'Champ Decimal(10,2) pour précision financière',
        ],
      },
      {
        title: 'Affichage',
        items: [
          'Hook useRestaurantCurrency() pour le formatage frontend',
          'Affichage automatique du symbole (€, FCFA, etc.)',
          'Cohérence dans les factures, reçus et vitrine',
          'Support des plans tarifaires en devise du revendeur',
        ],
      },
    ],
  },

  'Rôles & Permissions': {
    caption: "Système granulaire avec 5 types d\'utilisateurs, 12 sous-rôles et permissions par action.",
    highlights: [
      { label: 'Types', value: '5 (Admin, Reseller, Restaurant, Driver, Customer)' },
      { label: 'Sous-rôles', value: '12 total' },
    ],
    sections: [
      {
        title: 'Utilisateurs plateforme',
        items: [
          "SUPER_ADMIN : accès total à toutes les organisations",
          'Gestion des revendeurs et de la configuration globale',
        ],
      },
      {
        title: 'Revendeur',
        items: [
          '4 rôles : OWNER, ADMIN, SALES, MEMBER',
          'OWNER et ADMIN : gestion plans, vitrine, domaine, invitations',
          'SALES : gestion CRM et clients',
          'MEMBER : accès lecture seule',
        ],
      },
      {
        title: 'Restaurant',
        items: [
          '5 rôles : OWNER, MANAGER, STAFF, CASHIER, KITCHEN',
          "Middleware requireRole() pour protéger chaque route API",
          "OWNER/MANAGER : CRUD produits, catégories, settings",
          'CASHIER : accès POS uniquement',
          'KITCHEN : vue préparation commandes',
        ],
      },
      {
        title: 'Autres',
        items: [
          "DRIVER : vue livraisons assignées, mise à jour de statut",
          "CUSTOMER : compte, commandes, fidélité, avis",
          'PIN de caisse sécurisé pour les employés restaurant',
        ],
      },
    ],
  },

  'White-label complet': {
    caption: "Chaque revendeur opère sous sa propre marque : logo, couleurs, domaine, emails brandés.",
    highlights: [
      { label: 'Branding', value: '100% personnalisable' },
      { label: 'Emails', value: 'Templates brandés' },
    ],
    sections: [
      {
        title: 'Identité visuelle',
        items: [
          'Logo du revendeur (uploadable)',
          'Couleur primaire appliquée partout dans le dashboard',
          'Nom de marque affiché dans les interfaces',
          'Aucune mention de la plateforme mère',
        ],
      },
      {
        title: 'Domaine & Vitrine',
        items: [
          'Sous-domaine automatique : mamarque.izirestau.com',
          'Domaine personnalisé avec SSL automatique',
          'Vitrine publique à la marque du revendeur',
          'Formulaire de souscription intégré',
        ],
      },
      {
        title: 'Communication',
        items: [
          'Templates email personnalisables',
          "Emails de support brandés au nom de l'organisation",
          'Notifications aux clients au nom du revendeur',
        ],
      },
    ],
  },

  'API & Webhooks': {
    caption: "API REST documentée avec JWT, WebSocket temps réel, upload et rate limiting.",
    highlights: [
      { label: 'Auth', value: 'JWT + Refresh tokens' },
      { label: 'Temps réel', value: 'WebSocket' },
    ],
    sections: [
      {
        title: 'API REST',
        items: [
          'Architecture Express.js avec validation Zod',
          'Toutes les entités accessibles via API REST',
          'Pagination, filtres et recherche sur tous les endpoints',
          'Réponses JSON standardisées : { success, data, pagination }',
        ],
      },
      {
        title: 'Authentification',
        items: [
          'JWT avec Access Token et Refresh Token',
          'Middleware auth pour toutes les routes protégées',
          "Middleware de rôle par contexte (restaurant, revendeur, platform)",
          'Expiration et rotation automatique des tokens',
        ],
      },
      {
        title: 'Temps réel & Upload',
        items: [
          'WebSocket pour les notifications live',
          'Upload de fichiers (images produits, logos, avatars)',
          'Rate limiting par IP et par utilisateur',
          'Validation stricte des entrées (Zod schemas)',
        ],
      },
    ],
  },

  'Sécurité 2FA': {
    caption: "Authentification à deux facteurs TOTP avec codes de secours et rotation des tokens.",
    highlights: [
      { label: 'Méthode', value: 'TOTP (Google Authenticator)' },
      { label: 'Backup', value: 'Codes de secours' },
    ],
    sections: [
      {
        title: 'TOTP',
        items: [
          'Support TOTP standard (Google Authenticator, Authy, etc.)',
          'QR code de configuration généré côté serveur',
          'Vérification à chaque connexion si activé',
          'Activation/désactivation par utilisateur',
        ],
      },
      {
        title: 'Codes de secours',
        items: [
          'Génération de codes de backup à usage unique',
          'Utilisables si le device TOTP est perdu',
          'Régénération possible depuis les paramètres du compte',
        ],
      },
      {
        title: 'Tokens & Sessions',
        items: [
          "Access Token JWT avec expiration courte",
          'Refresh Token avec expiration longue',
          'Rotation automatique des refresh tokens',
          'Reset de mot de passe sécurisé par email',
          'Hash bcrypt pour le stockage des mots de passe',
        ],
      },
    ],
  },
}
