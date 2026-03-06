# 🍽️ IziResto - Plateforme SaaS White-Label pour Revendeurs

## 📋 Vue d'ensemble du Projet

**IziResto** est une plateforme SaaS B2B2C qui permet à des **revendeurs/agences** d'acheter des licences pour créer et vendre des sites de restaurants à leurs propres clients.

### Modèle Business

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           IZIRESTO (Toi)                                │
│                    Plateforme SaaS White-Label                          │
│         Vend des LICENCES aux revendeurs (Stripe/Paytech)               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     REVENDEURS / AGENCES (Ta cible)                     │
│  • Achètent une licence (ex: 10 sites, 50 sites, illimité)              │
│  • Créent des sites restaurants pour leurs clients                      │
│  • Gèrent leur portefeuille clients                                     │
│  • Facturent leurs clients (abonnement mensuel/annuel)                  │
│  • Ont leur propre comptabilité et CRM                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROPRIÉTAIRES DE RESTAURANTS                         │
│  • Sont ajoutés par le revendeur dans son organisation                  │
│  • Gèrent leur restaurant (produits, commandes, livraison, etc.)        │
│  • N'ont PAS de relation directe avec IziResto                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Hiérarchie des Utilisateurs

```
1. SUPER ADMIN IZIRESTO
   └── Gère la plateforme, les plans de licence, tous les revendeurs

2. REVENDEUR (RESELLER)
   ├── Propriétaire de l'agence (OWNER)
   ├── Admin de l'agence (ADMIN)
   └── Commercial de l'agence (SALES)

3. RESTAURANT (dans l'organisation du revendeur)
   ├── Propriétaire du restaurant (RESTAURANT_OWNER)
   ├── Manager du restaurant (RESTAURANT_MANAGER)
   └── Staff du restaurant (RESTAURANT_STAFF)

4. LIVREUR (DRIVER)

5. CLIENT FINAL (CUSTOMER)
```

---

## 🎯 Fonctionnalités par Rôle

### 🔴 Super Admin IziResto
- Dashboard global de la plateforme
- Gestion des plans de licence (Starter, Pro, Enterprise, Custom)
- Gestion des revendeurs
- Statistiques globales (revenus, nombre de sites, etc.)
- Configuration des paiements (Stripe, Paytech)
- Gestion des thèmes disponibles
- Support et tickets
- Configuration plateforme

### 🟠 Revendeur / Agence
**Dashboard Revendeur:**
- Vue d'ensemble de son organisation
- Nombre de sites utilisés / disponibles dans la licence
- Revenus générés par ses clients
- Alertes (échéances, paiements en retard)

**Gestion de Licence:**
- Voir sa licence actuelle
- Upgrader sa licence
- Historique des paiements à IziResto

**Gestion des Sites Restaurants:**
- Créer un nouveau site restaurant
- Activer / Désactiver un site
- Configurer le sous-domaine
- Transférer un site (changer de propriétaire)

**CRM Clients:**
- Liste de tous ses clients restaurants
- Fiche client détaillée
- Notes et historique des interactions
- Tags et segmentation

**Facturation Clients:**
- Créer des abonnements (mensuel/annuel)
- Générer des factures
- Suivre les paiements
- Relances automatiques par email
- Gérer les impayés

**Comptabilité:**
- Revenus par client
- Revenus par période
- Dépenses (licence IziResto)
- Marge et rentabilité
- Export comptable

**Équipe:**
- Ajouter des membres à son organisation
- Définir les rôles (Admin, Commercial)
- Permissions

**Paramètres:**
- Informations de l'agence
- Logo et branding
- Modèles d'emails
- Configuration facturation

### 🟢 Propriétaire de Restaurant
- Dashboard de SON restaurant uniquement
- Gestion complète du restaurant :
  - Produits, catégories, variants
  - Commandes
  - Clients
  - Staff
  - Livraison et livreurs
  - Inventaire
  - Recettes
  - POS
  - Analytics
  - Comptabilité du restaurant
  - Paramètres
  - Thème du storefront

---

## 🛠️ Stack Technique

### Monorepo Structure

```
iziresto/
├── apps/
│   ├── web/                      # Frontend Next.js
│   │   ├── (platform)/          # Dashboard IziResto (Super Admin)
│   │   ├── (reseller)/          # Dashboard Revendeur
│   │   ├── (restaurant)/        # Dashboard Restaurant
│   │   └── (storefront)/        # Storefront client
│   ├── api/                      # Backend Node.js Express
│   └── docs/                     # Documentation
├── packages/
│   ├── database/                 # Prisma schema & client
│   ├── shared/                   # Types, utils, constants
│   ├── ui/                       # Composants UI partagés
│   └── i18n/                     # Traductions FR/EN
├── docker-compose.yml
├── turbo.json
└── package.json
```

### Stack Technique Détaillée

#### Frontend (apps/web)
```
Framework:        Next.js 14 (App Router)
Language:         TypeScript 5.3+
Styling:          Tailwind CSS 3.4
Components:       shadcn/ui + Radix UI
State:            Zustand + React Query v5
Forms:            React Hook Form + Zod
Tables:           TanStack Table v8
Charts:           Recharts + Tremor
Maps:             Mapbox GL JS / Leaflet
i18n:             next-intl
Real-time:        Socket.io-client
Rich Editor:      Tiptap
Date:             date-fns
PDF:              @react-pdf/renderer
QR Code:          qrcode.react
```

#### Backend (apps/api)
```
Runtime:          Node.js 20 LTS
Framework:        Express.js + TypeScript
Validation:       Zod
ORM:              Prisma
Database:         PostgreSQL (Neon)
Cache:            Redis (Upstash)
Queue:            BullMQ
Real-time:        Socket.io
Auth:             JWT + Refresh Tokens
File Upload:      Multer + Cloudflare R2
Email:            Resend
SMS:              Twilio (optionnel)
Payments:         Stripe + Paytech
Search:           Meilisearch (optionnel)
Cron:             node-cron
```

#### Infrastructure
```
Hosting FE:       Vercel
Hosting BE:       Railway / Render / Fly.io
Database:         Neon (PostgreSQL serverless)
Cache:            Upstash Redis
Storage:          Cloudflare R2
CDN:              Cloudflare
DNS:              Cloudflare (wildcard subdomains)
```

---

## 📁 Structure Détaillée du Projet

### Frontend (apps/web)

```
apps/web/
├── src/
│   ├── app/
│   │   ├── [locale]/                          # i18n (fr/en)
│   │   │   │
│   │   │   ├── (marketing)/                   # Site public IziResto
│   │   │   │   ├── page.tsx                   # Landing page
│   │   │   │   ├── features/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── pricing/
│   │   │   │   │   └── page.tsx               # Plans de licence
│   │   │   │   ├── contact/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── demo/
│   │   │   │   │   └── page.tsx               # Demander une démo
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── (auth)/                        # Authentification
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx               # Inscription revendeur
│   │   │   │   ├── forgot-password/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reset-password/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── verify-email/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   └── layout.tsx
│   │   │
│   │   │
│   │   ├── platform/                          # 🔴 SUPER ADMIN IZIRESTO
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                       # Dashboard global
│   │   │   │
│   │   │   ├── resellers/                     # Gestion revendeurs
│   │   │   │   ├── page.tsx                   # Liste revendeurs
│   │   │   │   ├── [resellerId]/
│   │   │   │   │   ├── page.tsx               # Détail revendeur
│   │   │   │   │   ├── sites/
│   │   │   │   │   │   └── page.tsx           # Sites du revendeur
│   │   │   │   │   ├── billing/
│   │   │   │   │   │   └── page.tsx           # Facturation
│   │   │   │   │   └── activity/
│   │   │   │   │       └── page.tsx           # Activité
│   │   │   │   └── new/
│   │   │   │       └── page.tsx               # Créer revendeur
│   │   │   │
│   │   │   ├── licenses/                      # Plans de licence
│   │   │   │   ├── page.tsx                   # Liste des plans
│   │   │   │   ├── [planId]/
│   │   │   │   │   └── page.tsx               # Éditer plan
│   │   │   │   └── new/
│   │   │   │       └── page.tsx               # Créer plan
│   │   │   │
│   │   │   ├── sites/                         # Tous les sites
│   │   │   │   ├── page.tsx                   # Liste globale
│   │   │   │   └── [siteId]/
│   │   │   │       └── page.tsx               # Détail site
│   │   │   │
│   │   │   ├── revenue/                       # Revenus
│   │   │   │   ├── page.tsx                   # Overview
│   │   │   │   ├── transactions/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── payouts/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── themes/                        # Thèmes disponibles
│   │   │   │   ├── page.tsx
│   │   │   │   └── [themeId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── support/                       # Tickets support
│   │   │   │   ├── page.tsx
│   │   │   │   └── [ticketId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── settings/                      # Paramètres plateforme
│   │   │       ├── page.tsx
│   │   │       ├── payments/
│   │   │       │   └── page.tsx               # Config Stripe/Paytech
│   │   │       ├── emails/
│   │   │       │   └── page.tsx               # Templates emails
│   │   │       └── branding/
│   │   │           └── page.tsx
│   │   │
│   │   │
│   │   ├── reseller/                          # 🟠 DASHBOARD REVENDEUR
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                       # Dashboard revendeur
│   │   │   │
│   │   │   ├── onboarding/                    # Onboarding nouveau revendeur
│   │   │   │   ├── page.tsx
│   │   │   │   ├── license/
│   │   │   │   │   └── page.tsx               # Choisir licence
│   │   │   │   ├── payment/
│   │   │   │   │   └── page.tsx               # Paiement
│   │   │   │   ├── organization/
│   │   │   │   │   └── page.tsx               # Info organisation
│   │   │   │   └── complete/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── sites/                         # 📍 Gestion des sites
│   │   │   │   ├── page.tsx                   # Liste des sites
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx               # Créer un site
│   │   │   │   └── [siteId]/
│   │   │   │       ├── page.tsx               # Détail du site
│   │   │   │       ├── settings/
│   │   │   │       │   └── page.tsx           # Paramètres site
│   │   │   │       ├── owner/
│   │   │   │       │   └── page.tsx           # Gérer propriétaire
│   │   │   │       └── transfer/
│   │   │   │           └── page.tsx           # Transférer le site
│   │   │   │
│   │   │   ├── clients/                       # 👥 CRM Clients
│   │   │   │   ├── page.tsx                   # Liste clients
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx               # Ajouter client
│   │   │   │   └── [clientId]/
│   │   │   │       ├── page.tsx               # Fiche client
│   │   │   │       ├── sites/
│   │   │   │       │   └── page.tsx           # Sites du client
│   │   │   │       ├── invoices/
│   │   │   │       │   └── page.tsx           # Factures du client
│   │   │   │       ├── payments/
│   │   │   │       │   └── page.tsx           # Paiements
│   │   │   │       └── notes/
│   │   │   │           └── page.tsx           # Notes & historique
│   │   │   │
│   │   │   ├── billing/                       # 💰 Facturation clients
│   │   │   │   ├── page.tsx                   # Overview
│   │   │   │   ├── subscriptions/
│   │   │   │   │   ├── page.tsx               # Abonnements actifs
│   │   │   │   │   └── [subscriptionId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── invoices/
│   │   │   │   │   ├── page.tsx               # Toutes les factures
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx           # Créer facture
│   │   │   │   │   └── [invoiceId]/
│   │   │   │   │       └── page.tsx           # Détail facture
│   │   │   │   ├── payments/
│   │   │   │   │   └── page.tsx               # Paiements reçus
│   │   │   │   ├── overdue/
│   │   │   │   │   └── page.tsx               # Impayés
│   │   │   │   └── reminders/
│   │   │   │       └── page.tsx               # Relances
│   │   │   │
│   │   │   ├── accounting/                    # 📊 Comptabilité revendeur
│   │   │   │   ├── page.tsx                   # Overview
│   │   │   │   ├── revenue/
│   │   │   │   │   └── page.tsx               # Revenus
│   │   │   │   ├── expenses/
│   │   │   │   │   └── page.tsx               # Dépenses (licence)
│   │   │   │   ├── profit/
│   │   │   │   │   └── page.tsx               # Marge & rentabilité
│   │   │   │   └── export/
│   │   │   │       └── page.tsx               # Exports
│   │   │   │
│   │   │   ├── license/                       # 🔑 Ma licence
│   │   │   │   ├── page.tsx                   # Licence actuelle
│   │   │   │   ├── upgrade/
│   │   │   │   │   └── page.tsx               # Upgrader
│   │   │   │   └── history/
│   │   │   │       └── page.tsx               # Historique paiements
│   │   │   │
│   │   │   ├── team/                          # 👨‍💼 Équipe
│   │   │   │   ├── page.tsx                   # Membres
│   │   │   │   ├── invite/
│   │   │   │   │   └── page.tsx               # Inviter
│   │   │   │   └── [memberId]/
│   │   │   │       └── page.tsx               # Éditer membre
│   │   │   │
│   │   │   ├── analytics/                     # 📈 Analytics
│   │   │   │   ├── page.tsx
│   │   │   │   ├── sites/
│   │   │   │   │   └── page.tsx               # Performance sites
│   │   │   │   └── revenue/
│   │   │   │       └── page.tsx               # Analyse revenus
│   │   │   │
│   │   │   └── settings/                      # ⚙️ Paramètres
│   │   │       ├── page.tsx
│   │   │       ├── organization/
│   │   │       │   └── page.tsx               # Info organisation
│   │   │       ├── branding/
│   │   │       │   └── page.tsx               # Logo, couleurs
│   │   │       ├── emails/
│   │   │       │   └── page.tsx               # Templates emails
│   │   │       ├── billing-settings/
│   │   │       │   └── page.tsx               # Config facturation
│   │   │       └── notifications/
│   │   │           └── page.tsx
│   │   │
│   │   │
│   │   ├── restaurant/                        # 🟢 DASHBOARD RESTAURANT
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                       # Dashboard resto
│   │   │   │
│   │   │   ├── orders/                        # 📦 Commandes
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [orderId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── live/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── history/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── products/                      # 🍔 Produits
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── [productId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── categories/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── modifiers/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── import/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── inventory/                     # 📦 Inventaire
│   │   │   │   ├── page.tsx
│   │   │   │   ├── ingredients/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── suppliers/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── movements/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── alerts/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── recipes/                       # 👨‍🍳 Recettes
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [recipeId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── pos/                           # 💳 Point de Vente
│   │   │   │   ├── page.tsx
│   │   │   │   ├── terminal/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── customers/                     # 👥 Clients resto
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [customerId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── loyalty/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── staff/                         # 👨‍💼 Personnel
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── [staffId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── roles/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── schedule/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── delivery/                      # 🚚 Livraison
│   │   │   │   ├── page.tsx
│   │   │   │   ├── drivers/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [driverId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── zones/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── live-map/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── analytics/                     # 📊 Statistiques
│   │   │   │   ├── page.tsx
│   │   │   │   ├── sales/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── products/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── delivery/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── accounting/                    # 💰 Comptabilité resto
│   │   │   │   ├── page.tsx
│   │   │   │   ├── transactions/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── cash-register/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── taxes/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── exports/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── marketing/                     # 📣 Marketing
│   │   │   │   ├── page.tsx
│   │   │   │   ├── promotions/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── coupons/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── reviews/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── storefront/                    # 🏪 Ma boutique
│   │   │   │   ├── page.tsx
│   │   │   │   ├── themes/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── customize/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── qr-codes/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── media/                         # 🖼️ Médiathèque
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── settings/                      # ⚙️ Paramètres
│   │   │       ├── page.tsx
│   │   │       ├── business/
│   │   │       │   └── page.tsx
│   │   │       ├── location/
│   │   │       │   └── page.tsx
│   │   │       ├── hours/
│   │   │       │   └── page.tsx
│   │   │       ├── payments/
│   │   │       │   └── page.tsx
│   │   │       ├── taxes/
│   │   │       │   └── page.tsx
│   │   │       ├── seo/
│   │   │       │   └── page.tsx
│   │   │       └── legal/
│   │   │           └── page.tsx
│   │   │
│   │   │
│   │   ├── store/                             # 🛒 STOREFRONT CLIENT
│   │   │   └── [subdomain]/
│   │   │       ├── page.tsx                   # Accueil
│   │   │       ├── menu/
│   │   │       │   └── page.tsx
│   │   │       ├── product/
│   │   │       │   └── [slug]/
│   │   │       │       └── page.tsx
│   │   │       ├── cart/
│   │   │       │   └── page.tsx
│   │   │       ├── checkout/
│   │   │       │   └── page.tsx
│   │   │       ├── order/
│   │   │       │   └── [orderId]/
│   │   │       │       ├── page.tsx
│   │   │       │       └── track/
│   │   │       │           └── page.tsx
│   │   │       ├── account/
│   │   │       │   ├── page.tsx
│   │   │       │   └── orders/
│   │   │       │       └── page.tsx
│   │   │       └── layout.tsx
│   │   │
│   │   │
│   │   ├── driver/                            # 🚗 APP LIVREUR
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                       # Dashboard livreur
│   │   │   ├── deliveries/
│   │   │   │   ├── page.tsx                   # Livraisons en cours
│   │   │   │   ├── available/
│   │   │   │   │   └── page.tsx               # Disponibles
│   │   │   │   ├── [deliveryId]/
│   │   │   │   │   └── page.tsx               # Détail
│   │   │   │   └── history/
│   │   │   │       └── page.tsx
│   │   │   ├── earnings/
│   │   │   │   └── page.tsx                   # Gains
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   │
│   │   ├── api/                               # API Routes Next.js
│   │   │   └── webhooks/
│   │   │       ├── stripe/
│   │   │       │   └── route.ts
│   │   │       └── paytech/
│   │   │           └── route.ts
│   │   │
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                                # shadcn/ui
│   │   │
│   │   ├── platform/                          # Composants Super Admin
│   │   │   ├── ResellerCard.tsx
│   │   │   ├── ResellerTable.tsx
│   │   │   ├── LicensePlanCard.tsx
│   │   │   ├── GlobalStats.tsx
│   │   │   └── PlatformRevenue.tsx
│   │   │
│   │   ├── reseller/                          # Composants Revendeur
│   │   │   ├── SiteCard.tsx
│   │   │   ├── SiteCreateForm.tsx
│   │   │   ├── ClientCard.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   ├── InvoiceCard.tsx
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── SubscriptionCard.tsx
│   │   │   ├── LicenseUsage.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── OverdueAlerts.tsx
│   │   │   └── TeamMemberCard.tsx
│   │   │
│   │   ├── restaurant/                        # Composants Restaurant
│   │   │   ├── ... (tous les composants du dashboard resto)
│   │   │
│   │   ├── storefront/                        # Composants Storefront
│   │   │   └── ...
│   │   │
│   │   ├── driver/                            # Composants Livreur
│   │   │   └── ...
│   │   │
│   │   └── shared/
│   │       └── ...
│   │
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── auth.ts
│   │   ├── socket.ts
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useReseller.ts
│   │   ├── useLicense.ts
│   │   ├── useSites.ts
│   │   ├── useClients.ts
│   │   ├── useRestaurant.ts
│   │   └── ...
│   │
│   ├── stores/
│   │   └── ...
│   │
│   └── types/
│       └── index.ts
│
├── messages/
│   ├── fr.json
│   └── en.json
│
└── ...
```

---

## 🗄️ Schéma Base de Données (Prisma)

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS & AUTHENTICATION
// ============================================

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  firstName         String
  lastName          String
  phone             String?
  avatar            String?
  
  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
  
  // Type d'utilisateur global
  userType          UserType  @default(RESELLER)
  
  // Relations selon le type
  resellerProfile   ResellerMember?
  restaurantProfile RestaurantStaff?
  driverProfile     Driver?
  
  // Super Admin only
  isSuperAdmin      Boolean   @default(false)
  
  // Settings
  language          String    @default("fr")
  timezone          String    @default("Europe/Paris")
  
  // Tokens
  refreshTokens     RefreshToken[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([email])
  @@index([userType])
}

enum UserType {
  SUPER_ADMIN       // Admin IziResto
  RESELLER          // Membre d'une organisation revendeur
  RESTAURANT        // Staff d'un restaurant
  DRIVER            // Livreur
  CUSTOMER          // Client final (storefront)
}

model RefreshToken {
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  
  @@index([token])
  @@index([userId])
}

// ============================================
// LICENSE PLANS (Définis par IziResto)
// ============================================

model LicensePlan {
  id                String    @id @default(cuid())
  
  name              String    // "Starter", "Pro", "Enterprise"
  slug              String    @unique
  description       String?
  
  // Limites
  maxSites          Int       // Nombre de sites max (0 = illimité)
  maxUsersPerSite   Int       @default(5)
  
  // Features
  features          String[]  @default([])
  hasCustomDomain   Boolean   @default(false)
  hasAdvancedAnalytics Boolean @default(false)
  hasPrioritySupport Boolean  @default(false)
  hasWhiteLabel     Boolean   @default(false)
  hasApiAccess      Boolean   @default(false)
  
  // Pricing
  priceMonthly      Decimal   @db.Decimal(10, 2)
  priceYearly       Decimal   @db.Decimal(10, 2)
  currency          String    @default("EUR")
  
  // Stripe Price IDs
  stripePriceMonthly String?
  stripePriceYearly  String?
  
  // Paytech Price IDs
  paytechPriceMonthly String?
  paytechPriceYearly  String?
  
  // Status
  isActive          Boolean   @default(true)
  isPopular         Boolean   @default(false)
  sortOrder         Int       @default(0)
  
  // Relations
  licenses          License[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

// ============================================
// RESELLER ORGANIZATION
// ============================================

model ResellerOrganization {
  id                String    @id @default(cuid())
  
  // Infos
  name              String
  slug              String    @unique
  email             String
  phone             String?
  website           String?
  
  // Address
  address           String?
  city              String?
  postalCode        String?
  country           String    @default("FR")
  
  // Business
  businessName      String?   // Raison sociale
  siret             String?
  vatNumber         String?
  
  // Branding
  logo              String?
  primaryColor      String    @default("#FF6B00")
  
  // Status
  status            ResellerStatus @default(PENDING)
  isActive          Boolean   @default(true)
  
  // Licence actuelle
  licenseId         String?
  license           License?  @relation(fields: [licenseId], references: [id])
  
  // Relations
  members           ResellerMember[]
  sites             Site[]
  clients           Client[]
  
  // Facturation clients
  clientInvoices    ClientInvoice[]
  clientSubscriptions ClientSubscription[]
  
  // Paiements reçus
  clientPayments    ClientPayment[]
  
  // Templates emails personnalisés
  emailTemplates    ResellerEmailTemplate[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([slug])
  @@index([status])
}

enum ResellerStatus {
  PENDING           // En attente de validation
  ACTIVE            // Actif
  SUSPENDED         // Suspendu
  CANCELLED         // Résilié
}

model ResellerMember {
  id                String    @id @default(cuid())
  
  organizationId    String
  organization      ResellerOrganization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  role              ResellerRole @default(MEMBER)
  
  // Permissions personnalisées
  permissions       String[]  @default([])
  
  isActive          Boolean   @default(true)
  
  invitedBy         String?
  invitedAt         DateTime?
  joinedAt          DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([organizationId])
}

enum ResellerRole {
  OWNER             // Propriétaire (1 seul)
  ADMIN             // Administrateur
  SALES             // Commercial
  MEMBER            // Membre standard
}

// ============================================
// LICENSE (Achetée par un Revendeur)
// ============================================

model License {
  id                String    @id @default(cuid())
  
  planId            String
  plan              LicensePlan @relation(fields: [planId], references: [id])
  
  // Status
  status            LicenseStatus @default(ACTIVE)
  
  // Billing cycle
  billingCycle      BillingCycle @default(MONTHLY)
  
  // Payment provider
  paymentProvider   PaymentProvider @default(STRIPE)
  
  // Stripe
  stripeCustomerId  String?
  stripeSubscriptionId String?
  
  // Paytech
  paytechCustomerId String?
  paytechSubscriptionId String?
  
  // Dates
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean   @default(false)
  
  // Trial
  trialStart        DateTime?
  trialEnd          DateTime?
  
  // Usage tracking
  sitesUsed         Int       @default(0)
  
  // Relations
  organizations     ResellerOrganization[]
  payments          LicensePayment[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([status])
}

enum LicenseStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELLED
  UNPAID
  PAUSED
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

enum PaymentProvider {
  STRIPE
  PAYTECH
}

model LicensePayment {
  id                String    @id @default(cuid())
  
  licenseId         String
  license           License   @relation(fields: [licenseId], references: [id])
  
  amount            Decimal   @db.Decimal(10, 2)
  currency          String    @default("EUR")
  
  status            PaymentStatus @default(PENDING)
  
  provider          PaymentProvider
  providerPaymentId String?
  
  invoiceUrl        String?
  receiptUrl        String?
  
  paidAt            DateTime?
  
  createdAt         DateTime  @default(now())
  
  @@index([licenseId])
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}

// ============================================
// CLIENTS DU REVENDEUR
// ============================================

model Client {
  id                String    @id @default(cuid())
  
  organizationId    String
  organization      ResellerOrganization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Infos
  name              String    // Nom du restaurant/client
  contactFirstName  String
  contactLastName   String
  email             String
  phone             String?
  
  // Address
  address           String?
  city              String?
  postalCode        String?
  country           String    @default("FR")
  
  // Business
  businessName      String?
  siret             String?
  vatNumber         String?
  
  // CRM
  tags              String[]  @default([])
  notes             String?   @db.Text
  
  // Source
  source            String?   // "referral", "website", "cold_call"
  
  // Status
  status            ClientStatus @default(LEAD)
  isActive          Boolean   @default(true)
  
  // Relations
  sites             Site[]
  subscriptions     ClientSubscription[]
  invoices          ClientInvoice[]
  payments          ClientPayment[]
  interactions      ClientInteraction[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([organizationId, email])
  @@index([organizationId])
  @@index([status])
}

enum ClientStatus {
  LEAD              // Prospect
  ACTIVE            // Client actif
  CHURNED           // Perdu
  PAUSED            // En pause
}

model ClientInteraction {
  id                String    @id @default(cuid())
  
  clientId          String
  client            Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  type              InteractionType
  subject           String?
  content           String?   @db.Text
  
  performedBy       String?   // User ID
  
  createdAt         DateTime  @default(now())
  
  @@index([clientId])
}

enum InteractionType {
  NOTE
  CALL
  EMAIL
  MEETING
  TASK
}

// ============================================
// SITES (Restaurants créés par le Revendeur)
// ============================================

model Site {
  id                String    @id @default(cuid())
  
  // Appartenance
  organizationId    String
  organization      ResellerOrganization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  clientId          String?
  client            Client?   @relation(fields: [clientId], references: [id])
  
  // Subdomain
  subdomain         String    @unique
  customDomain      String?   @unique
  
  // Status
  status            SiteStatus @default(DRAFT)
  isActive          Boolean   @default(true)
  
  // Le restaurant lié
  restaurantId      String?   @unique
  restaurant        Restaurant? @relation(fields: [restaurantId], references: [id])
  
  // Dates
  publishedAt       DateTime?
  expiresAt         DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([organizationId])
  @@index([clientId])
  @@index([subdomain])
}

enum SiteStatus {
  DRAFT             // Brouillon
  ACTIVE            // En ligne
  SUSPENDED         // Suspendu
  EXPIRED           // Expiré
}

// ============================================
// RESTAURANT (Le business en lui-même)
// ============================================

model Restaurant {
  id                String    @id @default(cuid())
  
  // Lié au Site
  site              Site?
  
  // Basic Info
  name              String
  description       String?   @db.Text
  shortDescription  String?
  
  // Contact
  email             String
  phone             String
  website           String?
  
  // Address
  address           String
  addressLine2      String?
  city              String
  postalCode        String
  country           String    @default("FR")
  latitude          Float?
  longitude         Float?
  
  // Business Info
  businessName      String?
  siret             String?
  vatNumber         String?
  businessType      BusinessType @default(RESTAURANT)
  cuisineTypes      String[]  @default([])
  
  // Media
  logo              String?
  coverImage        String?
  images            String[]  @default([])
  
  // Settings
  settings          RestaurantSettings?
  
  // Opening Hours
  openingHours      OpeningHours[]
  specialHours      SpecialHours[]
  
  // Staff (équipe du restaurant)
  staff             RestaurantStaff[]
  
  // Menu
  products          Product[]
  categories        Category[]
  modifierGroups    ModifierGroup[]
  
  // Orders
  orders            Order[]
  
  // Customers (clients du restaurant)
  customers         RestaurantCustomer[]
  
  // Inventory
  ingredients       Ingredient[]
  suppliers         Supplier[]
  stockMovements    StockMovement[]
  recipes           Recipe[]
  
  // Delivery
  drivers           Driver[]
  deliveryZones     DeliveryZone[]
  deliverySettings  DeliverySettings?
  
  // Marketing
  promotions        Promotion[]
  coupons           Coupon[]
  reviews           Review[]
  
  // Accounting
  transactions      Transaction[]
  taxRates          TaxRate[]
  
  // Theme
  theme             RestaurantTheme?
  
  // Media Library
  mediaItems        MediaItem[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([name])
}

enum BusinessType {
  RESTAURANT
  FAST_FOOD
  CAFE
  BAKERY
  PIZZERIA
  FOOD_TRUCK
  DARK_KITCHEN
  CATERING
  OTHER
}

model RestaurantSettings {
  id                      String    @id @default(cuid())
  restaurantId            String    @unique
  restaurant              Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  // General
  currency                String    @default("EUR")
  language                String    @default("fr")
  timezone                String    @default("Europe/Paris")
  
  // Orders
  orderPrefix             String    @default("ORD")
  autoAcceptOrders        Boolean   @default(false)
  orderConfirmationEmail  Boolean   @default(true)
  orderNotificationSms    Boolean   @default(false)
  
  // Preparation
  avgPrepTime             Int       @default(30)
  maxOrdersPerSlot        Int?
  
  // Payment (pour le restaurant)
  acceptCash              Boolean   @default(true)
  acceptCard              Boolean   @default(true)
  acceptOnlinePayment     Boolean   @default(true)
  stripeAccountId         String?   // Stripe Connect du restaurant
  stripeAccountStatus     String?
  
  // Tips
  tipsEnabled             Boolean   @default(true)
  suggestedTips           Int[]     @default([10, 15, 20])
  
  // SEO
  metaTitle               String?
  metaDescription         String?
  metaKeywords            String[]  @default([])
  
  // Legal
  termsUrl                String?
  privacyUrl              String?
  legalNotice             String?   @db.Text
  
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
}

model RestaurantStaff {
  id              String    @id @default(cuid())
  
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  
  role            RestaurantRole @default(STAFF)
  
  // Info
  position        String?
  employeeId      String?
  
  // Status
  isActive        Boolean   @default(true)
  
  // POS PIN
  posPin          String?
  
  // Custom permissions
  permissions     String[]  @default([])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([restaurantId])
}

enum RestaurantRole {
  OWNER             // Propriétaire du restaurant (ajouté par le revendeur)
  MANAGER           // Manager
  STAFF             // Employé
  CASHIER           // Caissier
  KITCHEN           // Cuisine
}

// ============================================
// FACTURATION CLIENT (par le Revendeur)
// ============================================

model ClientSubscription {
  id                String    @id @default(cuid())
  
  organizationId    String
  organization      ResellerOrganization @relation(fields: [organizationId], references: [id])
  
  clientId          String
  client            Client    @relation(fields: [clientId], references: [id])
  
  // Détails
  name              String    // "Abonnement Site Restaurant X"
  description       String?
  
  // Pricing
  amount            Decimal   @db.Decimal(10, 2)
  currency          String    @default("EUR")
  billingCycle      BillingCycle @default(MONTHLY)
  
  // Status
  status            SubscriptionStatus @default(ACTIVE)
  
  // Dates
  startDate         DateTime
  endDate           DateTime?
  nextBillingDate   DateTime?
  cancelledAt       DateTime?
  
  // Relations
  invoices          ClientInvoice[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([organizationId])
  @@index([clientId])
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  PAUSED
  PENDING
}

model ClientInvoice {
  id                String    @id @default(cuid())
  
  organizationId    String
  organization      ResellerOrganization @relation(fields: [organizationId], references: [id])
  
  clientId          String
  client            Client    @relation(fields: [clientId], references: [id])
  
  subscriptionId    String?
  subscription      ClientSubscription? @relation(fields: [subscriptionId], references: [id])
  
  // Numéro
  invoiceNumber     String
  
  // Dates
  issueDate         DateTime  @db.Date
  dueDate           DateTime  @db.Date
  
  // Montants
  subtotal          Decimal   @db.Decimal(10, 2)
  taxRate           Decimal   @default(20) @db.Decimal(5, 2)
  taxAmount         Decimal   @db.Decimal(10, 2)
  total             Decimal   @db.Decimal(10, 2)
  
  // Status
  status            InvoiceStatus @default(DRAFT)
  
  // Paiement
  paidAmount        Decimal   @default(0) @db.Decimal(10, 2)
  paidAt            DateTime?
  
  // Items
  items             ClientInvoiceItem[]
  
  // PDF
  pdfUrl            String?
  
  // Notes
  notes             String?
  internalNotes     String?
  
  // Relances
  remindersSent     Int       @default(0)
  lastReminderAt    DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([organizationId, invoiceNumber])
  @@index([organizationId])
  @@index([clientId])
  @@index([status])
}

model ClientInvoiceItem {
  id                String    @id @default(cuid())
  
  invoiceId         String
  invoice           ClientInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  description       String
  quantity          Int       @default(1)
  unitPrice         Decimal   @db.Decimal(10, 2)
  total             Decimal   @db.Decimal(10, 2)
  
  @@index([invoiceId])
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  PARTIAL
  OVERDUE
  CANCELLED
  REFUNDED
}

model ClientPayment {
  id                String    @id @default(cuid())
  
  organizationId    String
  organization      ResellerOrganization @relation(fields: [organizationId], references: [id])
  
  clientId          String
  client            Client    @relation(fields: [clientId], references: [id])
  
  amount            Decimal   @db.Decimal(10, 2)
  currency          String    @default("EUR")
  
  method            ClientPaymentMethod
  reference         String?
  
  notes             String?
  
  receivedAt        DateTime  @default(now())
  
  createdAt         DateTime  @default(now())
  
  @@index([organizationId])
  @@index([clientId])
}

enum ClientPaymentMethod {
  BANK_TRANSFER
  CHECK
  CASH
  CARD
  OTHER
}

// ============================================
// EMAIL TEMPLATES (Revendeur)
// ============================================

model ResellerEmailTemplate {
  id                String    @id @default(cuid())
  
  organizationId    String
  organization      ResellerOrganization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  type              EmailTemplateType
  name              String
  subject           String
  body              String    @db.Text
  
  isActive          Boolean   @default(true)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([organizationId, type])
  @@index([organizationId])
}

enum EmailTemplateType {
  WELCOME_CLIENT
  INVOICE_SENT
  INVOICE_REMINDER
  INVOICE_OVERDUE
  SUBSCRIPTION_RENEWAL
  SUBSCRIPTION_CANCELLED
  SITE_ACTIVATED
  SITE_SUSPENDED
}

// ============================================
// OPENING HOURS
// ============================================

model OpeningHours {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  dayOfWeek       Int
  isOpen          Boolean   @default(true)
  
  slots           OpeningSlot[]
  
  @@unique([restaurantId, dayOfWeek])
}

model OpeningSlot {
  id              String    @id @default(cuid())
  openingHoursId  String
  openingHours    OpeningHours @relation(fields: [openingHoursId], references: [id], onDelete: Cascade)
  
  openTime        String
  closeTime       String
  serviceTypes    ServiceType[] @default([DELIVERY])
}

model SpecialHours {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  date            DateTime  @db.Date
  isClosed        Boolean   @default(false)
  reason          String?
  openTime        String?
  closeTime       String?
  
  @@unique([restaurantId, date])
}

enum ServiceType {
  DINE_IN
  PICKUP
  DELIVERY
}

// ============================================
// PRODUCTS & CATEGORIES
// ============================================

model Category {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  name            String
  nameEn          String?
  slug            String
  description     String?   @db.Text
  image           String?
  
  parentId        String?
  parent          Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        Category[] @relation("CategoryHierarchy")
  
  sortOrder       Int       @default(0)
  isActive        Boolean   @default(true)
  isVisible       Boolean   @default(true)
  
  products        Product[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([restaurantId, slug])
  @@index([restaurantId])
}

model Product {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  name            String
  nameEn          String?
  slug            String
  description     String?   @db.Text
  descriptionEn   String?   @db.Text
  
  price           Decimal   @db.Decimal(10, 2)
  compareAtPrice  Decimal?  @db.Decimal(10, 2)
  costPrice       Decimal?  @db.Decimal(10, 2)
  
  taxRateId       String?
  taxRate         TaxRate?  @relation(fields: [taxRateId], references: [id])
  taxIncluded     Boolean   @default(true)
  
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  
  image           String?
  images          String[]  @default([])
  
  trackInventory  Boolean   @default(false)
  stockQuantity   Int       @default(0)
  lowStockAlert   Int?
  
  recipeId        String?
  recipe          Recipe?   @relation(fields: [recipeId], references: [id])
  
  variants        ProductVariant[]
  modifierGroups  ProductModifierGroup[]
  
  sku             String?
  barcode         String?
  
  calories        Int?
  allergens       String[]  @default([])
  dietaryTags     String[]  @default([])
  
  isActive        Boolean   @default(true)
  isVisible       Boolean   @default(true)
  isFeatured      Boolean   @default(false)
  
  prepTime        Int?
  sortOrder       Int       @default(0)
  
  orderItems      OrderItem[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([restaurantId, slug])
  @@index([restaurantId])
  @@index([categoryId])
}

model ProductVariant {
  id              String    @id @default(cuid())
  productId       String
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  name            String
  nameEn          String?
  
  sku             String?
  barcode         String?
  
  price           Decimal   @db.Decimal(10, 2)
  compareAtPrice  Decimal?  @db.Decimal(10, 2)
  costPrice       Decimal?  @db.Decimal(10, 2)
  
  trackInventory  Boolean   @default(false)
  stockQuantity   Int       @default(0)
  
  image           String?
  
  isActive        Boolean   @default(true)
  sortOrder       Int       @default(0)
  
  orderItems      OrderItem[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([productId])
}

// ============================================
// MODIFIERS
// ============================================

model ModifierGroup {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  name            String
  nameEn          String?
  
  type            ModifierType @default(OPTIONAL)
  
  minSelections   Int       @default(0)
  maxSelections   Int?
  
  isRequired      Boolean   @default(false)
  isActive        Boolean   @default(true)
  
  modifiers       Modifier[]
  products        ProductModifierGroup[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([restaurantId])
}

enum ModifierType {
  SINGLE
  MULTIPLE
  OPTIONAL
}

model Modifier {
  id              String    @id @default(cuid())
  groupId         String
  group           ModifierGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  name            String
  nameEn          String?
  
  price           Decimal   @default(0) @db.Decimal(10, 2)
  
  isDefault       Boolean   @default(false)
  isActive        Boolean   @default(true)
  sortOrder       Int       @default(0)
  
  ingredientId    String?
  ingredient      Ingredient? @relation(fields: [ingredientId], references: [id])
  
  orderItemModifiers OrderItemModifier[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([groupId])
}

model ProductModifierGroup {
  productId       String
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  modifierGroupId String
  modifierGroup   ModifierGroup @relation(fields: [modifierGroupId], references: [id], onDelete: Cascade)
  
  sortOrder       Int       @default(0)
  
  @@id([productId, modifierGroupId])
}

// ============================================
// ORDERS
// ============================================

model Order {
  id                String    @id @default(cuid())
  restaurantId      String
  restaurant        Restaurant @relation(fields: [restaurantId], references: [id])
  
  orderNumber       String
  displayNumber     String
  
  customerId        String?
  customer          RestaurantCustomer? @relation(fields: [customerId], references: [id])
  
  guestName         String?
  guestEmail        String?
  guestPhone        String?
  
  serviceType       ServiceType @default(DELIVERY)
  
  status            OrderStatus @default(PENDING)
  paymentStatus     PaymentStatus @default(PENDING)
  
  items             OrderItem[]
  
  subtotal          Decimal   @db.Decimal(10, 2)
  taxAmount         Decimal   @db.Decimal(10, 2)
  deliveryFee       Decimal   @default(0) @db.Decimal(10, 2)
  tip               Decimal   @default(0) @db.Decimal(10, 2)
  discount          Decimal   @default(0) @db.Decimal(10, 2)
  total             Decimal   @db.Decimal(10, 2)
  
  couponId          String?
  coupon            Coupon?   @relation(fields: [couponId], references: [id])
  couponCode        String?
  
  paymentMethod     PaymentMethod?
  paymentIntentId   String?
  paidAt            DateTime?
  
  deliveryAddress   Json?
  deliveryNotes     String?
  deliveryZoneId    String?
  delivery          Delivery?
  
  pickupTime        DateTime?
  
  scheduledFor      DateTime?
  isScheduled       Boolean   @default(false)
  
  prepStartedAt     DateTime?
  prepCompletedAt   DateTime?
  estimatedPrepTime Int?
  
  customerNotes     String?   @db.Text
  internalNotes     String?   @db.Text
  
  cancelledAt       DateTime?
  cancelReason      String?
  cancelledBy       String?
  
  refundedAmount    Decimal?  @db.Decimal(10, 2)
  refundedAt        DateTime?
  refundReason      String?
  
  timeline          OrderTimeline[]
  
  source            OrderSource @default(WEBSITE)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([restaurantId, orderNumber])
  @@index([restaurantId])
  @@index([customerId])
  @@index([status])
  @@index([createdAt])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  OUT_FOR_DELIVERY
  DELIVERED
  PICKED_UP
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  AUTHORIZED
  PAID
  PARTIALLY_REFUNDED
  REFUNDED
  FAILED
  CANCELLED
}

enum PaymentMethod {
  CASH
  CARD
  CARD_ONLINE
  APPLE_PAY
  GOOGLE_PAY
  OTHER
}

enum OrderSource {
  WEBSITE
  MOBILE_APP
  POS
  PHONE
  WALK_IN
}

model OrderItem {
  id              String    @id @default(cuid())
  orderId         String
  order           Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  
  variantId       String?
  variant         ProductVariant? @relation(fields: [variantId], references: [id])
  
  productName     String
  variantName     String?
  
  quantity        Int
  unitPrice       Decimal   @db.Decimal(10, 2)
  totalPrice      Decimal   @db.Decimal(10, 2)
  
  modifiers       OrderItemModifier[]
  modifiersTotal  Decimal   @default(0) @db.Decimal(10, 2)
  
  specialInstructions String?
  
  createdAt       DateTime  @default(now())
  
  @@index([orderId])
}

model OrderItemModifier {
  id              String    @id @default(cuid())
  orderItemId     String
  orderItem       OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  
  modifierId      String
  modifier        Modifier  @relation(fields: [modifierId], references: [id])
  
  name            String
  price           Decimal   @db.Decimal(10, 2)
  quantity        Int       @default(1)
  
  @@index([orderItemId])
}

model OrderTimeline {
  id              String    @id @default(cuid())
  orderId         String
  order           Order     @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  status          OrderStatus
  message         String?
  userId          String?
  
  createdAt       DateTime  @default(now())
  
  @@index([orderId])
}

// ============================================
// CUSTOMERS (Clients du restaurant)
// ============================================

model RestaurantCustomer {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  email           String
  firstName       String
  lastName        String
  phone           String?
  
  addresses       CustomerAddress[]
  defaultAddressId String?
  
  totalOrders     Int       @default(0)
  totalSpent      Decimal   @default(0) @db.Decimal(10, 2)
  avgOrderValue   Decimal   @default(0) @db.Decimal(10, 2)
  lastOrderAt     DateTime?
  
  loyaltyPoints   Int       @default(0)
  
  marketingOptIn  Boolean   @default(true)
  
  tags            String[]  @default([])
  notes           String?   @db.Text
  
  isActive        Boolean   @default(true)
  
  orders          Order[]
  reviews         Review[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([restaurantId, email])
  @@index([restaurantId])
}

model CustomerAddress {
  id              String    @id @default(cuid())
  customerId      String
  customer        RestaurantCustomer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  label           String?
  street          String
  streetLine2     String?
  city            String
  postalCode      String
  country         String    @default("FR")
  
  latitude        Float?
  longitude       Float?
  
  instructions    String?
  
  isDefault       Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([customerId])
}

// ============================================
// DELIVERY
// ============================================

model DeliverySettings {
  id                  String    @id @default(cuid())
  restaurantId        String    @unique
  restaurant          Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  isEnabled           Boolean   @default(true)
  
  baseFee             Decimal   @default(0) @db.Decimal(10, 2)
  feePerKm            Decimal   @default(0) @db.Decimal(10, 2)
  freeDeliveryMin     Decimal?  @db.Decimal(10, 2)
  
  maxDistance         Float?
  minOrderAmount      Decimal?  @db.Decimal(10, 2)
  
  avgDeliveryTime     Int       @default(30)
  
  autoAssign          Boolean   @default(false)
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model DeliveryZone {
  id                  String    @id @default(cuid())
  restaurantId        String
  restaurant          Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  name                String
  polygon             Json
  
  deliveryFee         Decimal   @db.Decimal(10, 2)
  minOrderAmount      Decimal?  @db.Decimal(10, 2)
  estimatedTime       Int?
  
  isActive            Boolean   @default(true)
  priority            Int       @default(0)
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([restaurantId])
}

model Driver {
  id                  String    @id @default(cuid())
  restaurantId        String
  restaurant          Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id])
  
  licenseNumber       String?
  vehicleType         VehicleType @default(SCOOTER)
  vehiclePlate        String?
  
  isActive            Boolean   @default(true)
  isOnline            Boolean   @default(false)
  isAvailable         Boolean   @default(true)
  
  currentLatitude     Float?
  currentLongitude    Float?
  lastLocationUpdate  DateTime?
  
  totalDeliveries     Int       @default(0)
  avgRating           Float?
  
  currentDeliveryId   String?
  
  deliveries          Delivery[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([restaurantId])
}

enum VehicleType {
  BIKE
  SCOOTER
  CAR
  WALK
}

model Delivery {
  id                  String    @id @default(cuid())
  
  orderId             String    @unique
  order               Order     @relation(fields: [orderId], references: [id])
  
  driverId            String?
  driver              Driver?   @relation(fields: [driverId], references: [id])
  
  status              DeliveryStatus @default(PENDING)
  
  address             Json
  latitude            Float?
  longitude           Float?
  
  distanceKm          Float?
  estimatedTime       Int?
  
  assignedAt          DateTime?
  pickedUpAt          DateTime?
  deliveredAt         DateTime?
  
  trackingHistory     Json      @default("[]")
  
  customerNotes       String?
  deliveryProof       String?
  signature           String?
  
  customerRating      Int?
  customerFeedback    String?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([driverId])
  @@index([status])
}

enum DeliveryStatus {
  PENDING
  ASSIGNED
  DRIVER_EN_ROUTE
  AT_RESTAURANT
  PICKED_UP
  EN_ROUTE
  ARRIVED
  DELIVERED
  FAILED
  CANCELLED
}

// ============================================
// INVENTORY
// ============================================

model Ingredient {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  name            String
  sku             String?
  category        String?
  
  unit            IngredientUnit @default(UNIT)
  unitCost        Decimal   @default(0) @db.Decimal(10, 4)
  
  currentStock    Decimal   @default(0) @db.Decimal(10, 3)
  minStock        Decimal?  @db.Decimal(10, 3)
  maxStock        Decimal?  @db.Decimal(10, 3)
  reorderPoint    Decimal?  @db.Decimal(10, 3)
  
  supplierId      String?
  supplier        Supplier? @relation(fields: [supplierId], references: [id])
  
  isTracked       Boolean   @default(true)
  expirationDays  Int?
  
  recipeIngredients RecipeIngredient[]
  stockMovements    StockMovement[]
  modifiers         Modifier[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([restaurantId, name])
  @@index([restaurantId])
}

enum IngredientUnit {
  UNIT
  GRAM
  KILOGRAM
  MILLILITER
  LITER
  PORTION
}

model Supplier {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  name            String
  contactName     String?
  email           String?
  phone           String?
  address         String?
  
  notes           String?   @db.Text
  
  isActive        Boolean   @default(true)
  
  ingredients     Ingredient[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([restaurantId])
}

model StockMovement {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  ingredientId    String
  ingredient      Ingredient @relation(fields: [ingredientId], references: [id])
  
  type            StockMovementType
  quantity        Decimal   @db.Decimal(10, 3)
  
  reference       String?
  referenceType   String?
  
  unitCost        Decimal?  @db.Decimal(10, 4)
  totalCost       Decimal?  @db.Decimal(10, 2)
  
  reason          String?
  notes           String?
  
  performedBy     String?
  
  createdAt       DateTime  @default(now())
  
  @@index([restaurantId])
  @@index([ingredientId])
}

enum StockMovementType {
  PURCHASE
  SALE
  ADJUSTMENT
  WASTE
  TRANSFER
  RETURN
  PRODUCTION
}

// ============================================
// RECIPES
// ============================================

model Recipe {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?   @db.Text
  
  yieldQuantity   Decimal   @default(1) @db.Decimal(10, 2)
  yieldUnit       String    @default("portion")
  
  prepTime        Int?
  cookTime        Int?
  
  instructions    String?   @db.Text
  
  ingredients     RecipeIngredient[]
  
  totalCost       Decimal?  @db.Decimal(10, 2)
  costPerUnit     Decimal?  @db.Decimal(10, 2)
  
  products        Product[]
  
  isActive        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([restaurantId])
}

model RecipeIngredient {
  id              String    @id @default(cuid())
  recipeId        String
  recipe          Recipe    @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  ingredientId    String
  ingredient      Ingredient @relation(fields: [ingredientId], references: [id])
  
  quantity        Decimal   @db.Decimal(10, 3)
  unit            String
  
  notes           String?
  isOptional      Boolean   @default(false)
  
  @@index([recipeId])
}

// ============================================
// ACCOUNTING (Restaurant)
// ============================================

model TaxRate {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  name            String
  rate            Decimal   @db.Decimal(5, 2)
  
  isDefault       Boolean   @default(false)
  isActive        Boolean   @default(true)
  
  accountCode     String?
  
  products        Product[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([restaurantId])
}

model Transaction {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  type            TransactionType
  
  amount          Decimal   @db.Decimal(10, 2)
  currency        String    @default("EUR")
  
  referenceType   String?
  referenceId     String?
  
  paymentMethod   String?
  stripePaymentId String?
  
  description     String?
  
  status          TransactionStatus @default(COMPLETED)
  
  createdAt       DateTime  @default(now())
  
  @@index([restaurantId])
  @@index([type])
  @@index([createdAt])
}

enum TransactionType {
  SALE
  REFUND
  EXPENSE
  ADJUSTMENT
  FEE
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}

// ============================================
// MARKETING
// ============================================

model Promotion {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  name            String
  description     String?
  
  type            PromotionType
  
  discountType    DiscountType
  discountValue   Decimal   @db.Decimal(10, 2)
  
  minOrderAmount  Decimal?  @db.Decimal(10, 2)
  maxDiscount     Decimal?  @db.Decimal(10, 2)
  
  appliesToAll    Boolean   @default(true)
  productIds      String[]  @default([])
  categoryIds     String[]  @default([])
  
  startDate       DateTime
  endDate         DateTime?
  
  activeDays      Int[]     @default([0, 1, 2, 3, 4, 5, 6])
  activeFrom      String?
  activeTo        String?
  
  isActive        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([restaurantId])
}

enum PromotionType {
  DISCOUNT
  HAPPY_HOUR
  BUNDLE
  BOGO
  FREE_DELIVERY
}

enum DiscountType {
  PERCENTAGE
  FIXED
  FREE_ITEM
}

model Coupon {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  code            String
  description     String?
  
  discountType    DiscountType
  discountValue   Decimal   @db.Decimal(10, 2)
  
  minOrderAmount  Decimal?  @db.Decimal(10, 2)
  maxDiscount     Decimal?  @db.Decimal(10, 2)
  maxUses         Int?
  maxUsesPerCustomer Int?   @default(1)
  
  usedCount       Int       @default(0)
  
  appliesToAll    Boolean   @default(true)
  productIds      String[]  @default([])
  categoryIds     String[]  @default([])
  
  startDate       DateTime  @default(now())
  endDate         DateTime?
  
  isActive        Boolean   @default(true)
  
  orders          Order[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([restaurantId, code])
  @@index([restaurantId])
  @@index([code])
}

model Review {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  customerId      String
  customer        RestaurantCustomer @relation(fields: [customerId], references: [id])
  
  orderId         String?
  
  rating          Int
  title           String?
  comment         String?   @db.Text
  
  foodRating      Int?
  serviceRating   Int?
  deliveryRating  Int?
  
  response        String?   @db.Text
  respondedAt     DateTime?
  respondedBy     String?
  
  isPublished     Boolean   @default(true)
  isVerified      Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([restaurantId])
  @@index([customerId])
}

// ============================================
// THEMING
// ============================================

model RestaurantTheme {
  id              String    @id @default(cuid())
  restaurantId    String    @unique
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  baseTheme       String    @default("default")
  
  primaryColor    String    @default("#FF6B00")
  secondaryColor  String    @default("#1A1A1A")
  accentColor     String    @default("#FFB800")
  backgroundColor String    @default("#FFFFFF")
  textColor       String    @default("#1A1A1A")
  
  headingFont     String    @default("Inter")
  bodyFont        String    @default("Inter")
  
  layoutStyle     String    @default("grid")
  headerStyle     String    @default("standard")
  
  customCss       String?   @db.Text
  
  socialLinks     Json?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// ============================================
// MEDIA
// ============================================

model MediaItem {
  id              String    @id @default(cuid())
  restaurantId    String
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  filename        String
  originalName    String
  mimeType        String
  size            Int
  
  url             String
  thumbnailUrl    String?
  
  width           Int?
  height          Int?
  
  folder          String?
  tags            String[]  @default([])
  alt             String?
  
  uploadedBy      String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([restaurantId])
}
```

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/register              # Inscription revendeur
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify-email
GET    /api/auth/me
```

### Platform (Super Admin)
```
GET    /api/platform/stats                    # Stats globales
GET    /api/platform/resellers                # Liste revendeurs
GET    /api/platform/resellers/:id            
POST   /api/platform/resellers/:id/suspend    
POST   /api/platform/resellers/:id/activate   
GET    /api/platform/licenses                 # Plans de licence
POST   /api/platform/licenses                 
PUT    /api/platform/licenses/:id             
DELETE /api/platform/licenses/:id             
GET    /api/platform/revenue                  # Revenus
GET    /api/platform/sites                    # Tous les sites
```

### Reseller (Dashboard Revendeur)
```
# Organisation
GET    /api/reseller/organization             
PUT    /api/reseller/organization             

# Licence
GET    /api/reseller/license                  
POST   /api/reseller/license/upgrade          
GET    /api/reseller/license/payments         

# Sites
GET    /api/reseller/sites                    
POST   /api/reseller/sites                    # Créer un site
GET    /api/reseller/sites/:id                
PUT    /api/reseller/sites/:id                
DELETE /api/reseller/sites/:id                
POST   /api/reseller/sites/:id/activate       
POST   /api/reseller/sites/:id/suspend        
POST   /api/reseller/sites/:id/assign-owner   # Assigner propriétaire

# Clients (CRM)
GET    /api/reseller/clients                  
POST   /api/reseller/clients                  
GET    /api/reseller/clients/:id              
PUT    /api/reseller/clients/:id              
DELETE /api/reseller/clients/:id              
GET    /api/reseller/clients/:id/interactions 
POST   /api/reseller/clients/:id/interactions 

# Facturation
GET    /api/reseller/subscriptions            
POST   /api/reseller/subscriptions            
PUT    /api/reseller/subscriptions/:id        
POST   /api/reseller/subscriptions/:id/cancel 

GET    /api/reseller/invoices                 
POST   /api/reseller/invoices                 
GET    /api/reseller/invoices/:id             
PUT    /api/reseller/invoices/:id             
POST   /api/reseller/invoices/:id/send        
POST   /api/reseller/invoices/:id/reminder    

GET    /api/reseller/payments                 
POST   /api/reseller/payments                 

# Comptabilité
GET    /api/reseller/accounting/overview      
GET    /api/reseller/accounting/revenue       
GET    /api/reseller/accounting/expenses      
GET    /api/reseller/accounting/export        

# Équipe
GET    /api/reseller/team                     
POST   /api/reseller/team/invite              
PUT    /api/reseller/team/:id                 
DELETE /api/reseller/team/:id                 

# Analytics
GET    /api/reseller/analytics/sites          
GET    /api/reseller/analytics/revenue        
GET    /api/reseller/analytics/clients        

# Settings
GET    /api/reseller/settings                 
PUT    /api/reseller/settings                 
GET    /api/reseller/email-templates          
PUT    /api/reseller/email-templates/:type    
```

### Restaurant (Dashboard Restaurant)
```
# Toutes les routes restaurant existantes...
GET    /api/restaurant/...
# (Voir structure précédente)
```

### Public Storefront
```
GET    /api/store/:subdomain                  
GET    /api/store/:subdomain/menu             
POST   /api/store/:subdomain/orders           
GET    /api/store/:subdomain/orders/:id/track 
# etc...
```

### Driver
```
GET    /api/driver/profile                    
POST   /api/driver/online                     
POST   /api/driver/offline                    
GET    /api/driver/deliveries                 
POST   /api/driver/deliveries/:id/accept      
POST   /api/driver/deliveries/:id/complete    
POST   /api/driver/location                   
```

### Webhooks
```
POST   /api/webhooks/stripe                   # Paiements Stripe
POST   /api/webhooks/paytech                  # Paiements Paytech
```

---

## 🔐 Variables d'Environnement

```bash
# .env.example

# ============ APP ============
NODE_ENV=development
PORT=4000
API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000

# ============ DATABASE ============
DATABASE_URL=postgresql://user:pass@host/iziresto

# ============ REDIS ============
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ============ JWT ============
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# ============ PAYMENTS ============
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paytech (Sénégal/Afrique)
PAYTECH_API_KEY=...
PAYTECH_SECRET_KEY=...
PAYTECH_WEBHOOK_SECRET=...

# ============ STORAGE ============
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=iziresto
R2_ENDPOINT=https://...
R2_PUBLIC_URL=https://...

# ============ EMAIL ============
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@iziresto.com

# ============ SMS (Optional) ============
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...

# ============ DOMAINS ============
ROOT_DOMAIN=iziresto.com

# ============ NEXTAUTH (Frontend) ============
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# ============ MONITORING ============
SENTRY_DSN=https://...
```

---

## 💳 Plans de Licence (Exemple)

| Plan | Sites Max | Prix/mois | Prix/an | Features |
|------|-----------|-----------|---------|----------|
| **Starter** | 5 | 49€ | 490€ | Base features |
| **Pro** | 20 | 99€ | 990€ | + Custom domain, Analytics |
| **Business** | 50 | 199€ | 1990€ | + White-label, API |
| **Enterprise** | Illimité | Sur devis | Sur devis | + Support dédié |

---

## 🚀 Guide de Démarrage Windsurf

### Commandes d'initialisation

```bash
# 1. Créer le monorepo
mkdir iziresto && cd iziresto
pnpm init

# 2. Installer Turbo
pnpm add -D turbo

# 3. Créer la structure
mkdir -p apps/web apps/api packages/database packages/shared packages/ui packages/i18n

# 4. Frontend Next.js
cd apps/web
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir

# 5. Backend Express
cd ../api
pnpm init
pnpm add express cors helmet morgan compression socket.io jsonwebtoken bcryptjs zod
pnpm add -D typescript @types/node @types/express ts-node-dev

# 6. Prisma
cd ../../packages/database
pnpm init
pnpm add prisma @prisma/client
npx prisma init

# 7. shadcn/ui
cd ../../apps/web
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select tabs dialog sheet dropdown-menu toast table badge avatar skeleton separator

# 8. Dépendances frontend
pnpm add @tanstack/react-query zustand react-hook-form @hookform/resolvers zod next-intl next-auth socket.io-client recharts @tanstack/react-table date-fns lucide-react framer-motion @tiptap/react @tiptap/starter-kit mapbox-gl qrcode.react

# 9. Retour à la racine
cd ../..
pnpm install
pnpm dev
```

### Prompt Windsurf Initial

```
Je veux créer IziResto, une plateforme SaaS B2B2C pour revendeurs de solutions restaurant.

C'est un monorepo avec:
- apps/web: Next.js 14 + TypeScript + Tailwind + shadcn/ui
- apps/api: Node.js Express + TypeScript
- packages/database: Prisma + Neon PostgreSQL

Modèle business:
1. IziResto vend des LICENCES à des REVENDEURS (Stripe + Paytech)
2. Les REVENDEURS créent des sites pour leurs CLIENTS restaurants
3. Les PROPRIÉTAIRES de restaurant gèrent leur resto

3 dashboards:
- Platform (Super Admin IziResto)
- Reseller (Revendeur/Agence)
- Restaurant (Propriétaire resto)

+ Storefront client + App livreur

Commence par créer la structure et le schéma Prisma.
```

---

## 📄 Résumé des Changements

### Ancien Modèle (B2C)
```
IziResto → Restaurant
```

### Nouveau Modèle (B2B2C)
```
IziResto → Revendeur → Restaurant
          (Licence)    (Site)
```

### Nouvelles Entités
- `LicensePlan` - Plans vendus par IziResto
- `License` - Licence achetée par un revendeur
- `ResellerOrganization` - Organisation du revendeur
- `ResellerMember` - Membres de l'équipe revendeur
- `Client` - Clients du revendeur (restaurants)
- `Site` - Site restaurant créé par le revendeur
- `ClientSubscription` - Abonnement vendu au client
- `ClientInvoice` - Facture du revendeur vers son client
- `ClientPayment` - Paiement reçu par le revendeur

### Nouveaux Dashboards
1. **Platform** - Super Admin IziResto
2. **Reseller** - Dashboard Revendeur (CRM, facturation, sites)
3. **Restaurant** - Dashboard Restaurant (inchangé)

---

**Créé avec ❤️ pour les revendeurs de solutions restaurant**
