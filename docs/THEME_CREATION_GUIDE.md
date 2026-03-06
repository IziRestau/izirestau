# Guide de Création de Thème Storefront - IziResto

## Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Structure des fichiers d'un thème](#2-structure-des-fichiers-dun-thème)
3. [Le registre de thèmes (_registry.ts)](#3-le-registre-de-thèmes-_registryts)
4. [Les types partagés (_types.ts)](#4-les-types-partagés-_typests)
5. [Le fichier d'entrée du thème (index.ts)](#5-le-fichier-dentrée-du-thème-indexts)
6. [Les composants obligatoires](#6-les-composants-obligatoires)
7. [Le système de sections et sectionConfig](#7-le-système-de-sections-et-sectionconfig)
8. [Les sections-config (champs éditeur)](#8-les-sections-config-champs-éditeur)
9. [Les composants de section (rendu)](#9-les-composants-de-section-rendu)
10. [Le ThemeProvider et les variables CSS](#10-le-themeprovider-et-les-variables-css)
11. [Le StorefrontShell (orchestrateur)](#11-le-storefrontshell-orchestrateur)
12. [Les données disponibles (props)](#12-les-données-disponibles-props)
13. [Conventions de style et responsive](#13-conventions-de-style-et-responsive)
14. [Gestion des icones personnalisables](#14-gestion-des-icones-personnalisables)
15. [Le Header : navigation et menu mobile](#15-le-header--navigation-et-menu-mobile)
16. [Le Footer : designs multiples](#16-le-footer--designs-multiples)
17. [Checklist de création d'un nouveau thème](#17-checklist-de-création-dun-nouveau-thème)
18. [Erreurs courantes à éviter](#18-erreurs-courantes-à-éviter)

---

## 1. Vue d'ensemble de l'architecture

Le système de thèmes storefront est basé sur un **pattern de registre + lazy loading**. Chaque thème est un dossier autonome qui exporte un objet `ThemeComponents` contenant tous les composants nécessaires au rendu du storefront.

```
Flux de données :

StorefrontShell (orchestrateur)
  -> StoreThemeProvider (injecte le thème via Context)
    -> _registry.ts (charge le thème dynamiquement)
      -> themes/{themeId}/index.ts (exporte les composants)
        -> Header, Footer, HomePage, ContactPage, CustomPage, etc.
          -> sections/ (composants de rendu par section)
          -> sections-config/ (configuration des champs éditeur)
```

Le `StorefrontShell` est le composant racine. Il :
- Récupère les données du store (restaurant, menu, thème, pages) via l'API
- Charge dynamiquement les composants du thème via `loadThemeComponents(themeId)`
- Passe les props appropriées à chaque composant du thème
- Gère le panier, la modale produit, et le drawer panier

---

## 2. Structure des fichiers d'un thème

Chaque thème vit dans `apps/web/src/components/storefront/themes/{themeId}/`.

```
themes/
├── _registry.ts              # Registre de tous les thèmes
├── _types.ts                 # Types partagés (NE PAS MODIFIER)
├── {themeId}/                # Dossier du thème (ex: "default", "elegant", "rustic")
│   ├── index.ts              # Point d'entrée, exporte ThemeComponents
│   ├── sectionConfig.ts      # Agrège toutes les sections-config
│   │
│   ├── Header.tsx            # Composant Header (navigation)
│   ├── MobileMenuPanel.tsx   # Menu mobile (side panel)
│   ├── Footer.tsx            # Composant Footer
│   ├── AnnouncementBar.tsx   # Barre d'annonce
│   ├── HomePage.tsx          # Page d'accueil (orchestre les sections home)
│   ├── ContactPage.tsx       # Page contact (orchestre les sections contact)
│   ├── CustomPage.tsx        # Pages personnalisées (orchestre les sections custom)
│   ├── Hero.tsx              # Wrapper Hero pour la page menu
│   ├── MenuSection.tsx       # Wrapper catalogue pour la page menu
│   ├── RestaurantInfo.tsx    # Wrapper infos restaurant pour la page menu
│   ├── ProductCard.tsx       # Carte produit (utilisée dans le catalogue)
│   ├── ProductModal.tsx      # Modale détail produit
│   ├── CartDrawer.tsx        # Drawer panier
│   │
│   ├── sections/             # Composants de rendu des sections
│   │   ├── home/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── TwoColumnsSection.tsx
│   │   │   ├── StatsSection.tsx
│   │   │   ├── FeaturedSection.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   ├── GallerySection.tsx
│   │   │   ├── TestimonialsSection.tsx
│   │   │   └── CtaSection.tsx
│   │   ├── menu/
│   │   │   ├── MenuHeroSection.tsx
│   │   │   ├── CatalogSection.tsx
│   │   │   └── MenuInfoSection.tsx
│   │   ├── contact/
│   │   │   ├── ContactHeaderSection.tsx
│   │   │   ├── ContactInfoSection.tsx
│   │   │   ├── ContactFormSection.tsx
│   │   │   └── ContactMapSection.tsx
│   │   └── custom/
│   │       ├── CustomHeaderSection.tsx
│   │       ├── CustomContentSection.tsx
│   │       ├── CustomImageTextSection.tsx
│   │       ├── CustomGallerySection.tsx
│   │       └── CustomCtaSection.tsx
│   │
│   └── sections-config/      # Configuration des champs éditeur
│       ├── home/
│       │   ├── index.ts      # Exporte homeSections: ThemeSectionDef[]
│       │   ├── hero.ts
│       │   ├── two-columns.ts
│       │   ├── stats.ts
│       │   ├── featured.ts
│       │   ├── about.ts
│       │   ├── gallery.ts
│       │   ├── testimonials.ts
│       │   └── cta.ts
│       ├── menu/
│       │   ├── index.ts      # Exporte menuSections: ThemeSectionDef[]
│       │   ├── hero.ts
│       │   ├── catalog.ts
│       │   └── info.ts
│       ├── contact/
│       │   ├── index.ts      # Exporte contactSections: ThemeSectionDef[]
│       │   ├── header.ts
│       │   ├── contact-info.ts
│       │   ├── form.ts
│       │   └── map.ts
│       └── custom/
│           ├── index.ts      # Exporte customSections: ThemeSectionDef[]
│           ├── header.ts
│           ├── content.ts
│           ├── image-text.ts
│           ├── gallery.ts
│           └── cta.ts
```

---

## 3. Le registre de thèmes (_registry.ts)

Fichier : `apps/web/src/components/storefront/themes/_registry.ts`

Ce fichier est le point central qui recense tous les thèmes disponibles. Pour ajouter un nouveau thème, il faut l'enregistrer ici.

```typescript
import type { ThemeMeta, ThemeComponents } from './_types'

interface ThemeEntry {
  meta: ThemeMeta
  load: () => Promise<{ default: ThemeComponents }>
}

export const THEME_REGISTRY: Record<string, ThemeEntry> = {
  default: {
    meta: {
      id: 'default',
      name: 'Moderne',
      description: 'Un design moderne et épuré, idéal pour les restaurants contemporains',
      preview: '/themes/default-preview.png',
      tags: ['moderne', 'clean', 'minimaliste'],
    },
    load: () => import('./default'),
  },
  // AJOUTER VOTRE NOUVEAU THÈME ICI :
  // elegant: {
  //   meta: {
  //     id: 'elegant',
  //     name: 'Élégant',
  //     description: 'Un design raffiné pour les restaurants gastronomiques',
  //     preview: '/themes/elegant-preview.png',
  //     tags: ['élégant', 'luxe', 'gastronomique'],
  //   },
  //   load: () => import('./elegant'),
  // },
}
```

**Points importants :**
- L'`id` dans `meta` doit correspondre exactement à la clé dans `THEME_REGISTRY` et au nom du dossier
- Le `load` utilise un `import()` dynamique pour le lazy loading (le thème n'est chargé que quand nécessaire)
- Le `preview` est le chemin vers une image de prévisualisation dans `/public/themes/`
- Les `tags` servent au filtrage dans le sélecteur de thème

---

## 4. Les types partagés (_types.ts)

Fichier : `apps/web/src/components/storefront/themes/_types.ts`

Ce fichier contient **tous les types et interfaces** que les thèmes doivent respecter. **Ne jamais modifier ce fichier** sauf pour ajouter de nouvelles propriétés globales.

### Types de données (venant de l'API)

| Interface | Description |
|-----------|-------------|
| `StoreThemeData` | Couleurs, polices, styles du thème (primaryColor, headingFont, buttonStyle, headerDesign, etc.) |
| `StoreRestaurantData` | Infos restaurant (nom, adresse, logo, images, contact, etc.) |
| `StoreSettingsData` | Paramètres (devise, paiement, SEO, etc.) |
| `StoreOpeningHour` | Horaires d'ouverture par jour |
| `StoreDeliveryData` | Infos livraison (frais, temps moyen, etc.) |
| `StoreData` | Agrégat de toutes les données du store |
| `StoreCategory` | Catégorie de menu avec ses produits |
| `StoreProduct` | Produit avec variantes, modificateurs, allergènes |
| `StorePageLink` | Lien de navigation (slug, title, pageType, href) |

### Props des composants obligatoires

| Interface | Composant | Props clés |
|-----------|-----------|------------|
| `HeaderProps` | Header | restaurant, theme, cartItemCount, onCartClick, pages, currentPath |
| `HeroProps` | Hero | restaurant, theme, openingHours, menuHref, sections |
| `MenuSectionProps` | MenuSection | categories, theme, settings, onProductClick, sections |
| `ProductCardProps` | ProductCard | product, theme, settings, onClick, sectionOverrides |
| `ProductModalProps` | ProductModal | product, theme, settings, isOpen, onClose, onAddToCart |
| `CartDrawerProps` | CartDrawer | theme, settings, isOpen, onClose, onCheckout |
| `FooterProps` | Footer | restaurant, theme, openingHours |
| `RestaurantInfoProps` | RestaurantInfo | restaurant, theme, openingHours, delivery, sections |
| `AnnouncementBarProps` | AnnouncementBar | theme |
| `HomePageProps` | HomePage | restaurant, theme, openingHours, categories, settings, delivery, menuHref, contactHref, onProductClick, sections |
| `ContactPageProps` | ContactPage | restaurant, theme, openingHours, delivery, subdomain, sections |
| `CustomPageProps` | CustomPage | page, restaurant, theme, sections, sectionOrder |

### Types du système de sections

| Type | Description |
|------|-------------|
| `SectionFieldType` | Types de champs : `'text' \| 'textarea' \| 'color' \| 'switch' \| 'select' \| 'number' \| 'slider' \| 'image' \| 'gallery' \| 'icon' \| 'testimonials' \| 'separator'` |
| `SectionFieldDef` | Définition d'un champ (key, label, type, defaultValue, showWhen, etc.) |
| `ThemeSectionDef` | Définition d'une section (id, label, description, fields[]) |
| `ThemePageSections` | Map pageType -> ThemeSectionDef[] |
| `PageSectionsData` | Données sauvegardées : `Record<string, Record<string, unknown>>` |

### ThemeComponents (contrat obligatoire)

```typescript
export interface ThemeComponents {
  Header: React.ComponentType<HeaderProps>
  Hero: React.ComponentType<HeroProps>
  MenuSection: React.ComponentType<MenuSectionProps>
  ProductCard: React.ComponentType<ProductCardProps>
  ProductModal: React.ComponentType<ProductModalProps>
  CartDrawer: React.ComponentType<CartDrawerProps>
  Footer: React.ComponentType<FooterProps>
  RestaurantInfo: React.ComponentType<RestaurantInfoProps>
  AnnouncementBar: React.ComponentType<AnnouncementBarProps>
  HomePage: React.ComponentType<HomePageProps>
  ContactPage: React.ComponentType<ContactPageProps>
  CustomPage: React.ComponentType<CustomPageProps>
  sectionConfig: ThemePageSections
}
```

Chaque thème **doit** exporter un objet conforme à cette interface. Aucun composant ne peut manquer.

---

## 5. Le fichier d'entrée du thème (index.ts)

Fichier : `themes/{themeId}/index.ts`

Ce fichier importe tous les composants du thème et les exporte comme un seul objet `ThemeComponents`.

```typescript
import type { ThemeComponents } from '../_types'
import { Header } from './Header'
import { Hero } from './Hero'
import { MenuSection } from './MenuSection'
import { ProductCard } from './ProductCard'
import { ProductModal } from './ProductModal'
import { CartDrawer } from './CartDrawer'
import { Footer } from './Footer'
import { RestaurantInfo } from './RestaurantInfo'
import { AnnouncementBar } from './AnnouncementBar'
import { HomePage } from './HomePage'
import { ContactPage } from './ContactPage'
import { CustomPage } from './CustomPage'
import { defaultSectionConfig } from './sectionConfig'

const myTheme: ThemeComponents = {
  Header,
  Hero,
  MenuSection,
  ProductCard,
  ProductModal,
  CartDrawer,
  Footer,
  RestaurantInfo,
  AnnouncementBar,
  HomePage,
  ContactPage,
  CustomPage,
  sectionConfig: defaultSectionConfig,
}

export default myTheme
```

**Important :** L'export doit être un `export default`.

---

## 6. Les composants obligatoires

### 6.1 AnnouncementBar

Barre d'annonce en haut du site. Affichée conditionnellement selon `theme.announcementActive`.

```typescript
export function AnnouncementBar({ theme }: AnnouncementBarProps) {
  if (!theme.announcementActive || !theme.announcementText) return null
  // Rendu de la barre
}
```

### 6.2 Header

Le composant le plus complexe. Il gère :
- **3 designs** : `standard`, `centered`, `floating`
- **Position du logo** : `left` ou `center`
- **Sticky** : `theme.headerSticky`
- **Navigation** : liens vers les pages avec état actif
- **Panier** : bouton avec compteur
- **Menu mobile** : hamburger + `MobileMenuPanel`

**Logique `isActive` pour la navigation :**

```typescript
const isActive = (href: string) => {
  // Match exact
  if (href === currentPath) return true
  if (currentPath === href + '/') return true
  // La page home ne doit PAS matcher par prefix (sinon elle est toujours active)
  const page = pages.find(p => p.href === href)
  if (page?.pageType === 'home') return false
  // Pour les autres pages, match par prefix (ex: /store/demo/menu/xxx)
  const hrefWithSlash = href.endsWith('/') ? href : href + '/'
  if (currentPath.startsWith(hrefWithSlash)) return true
  return false
}
```

**Propriétés du thème utilisées par le Header :**

| Propriété | Type | Description |
|-----------|------|-------------|
| `headerDesign` | `string` | `'standard'`, `'centered'`, `'floating'` |
| `logoPosition` | `string` | `'left'`, `'center'` |
| `headerSticky` | `boolean` | Header fixe au scroll |
| `headerBgOpacity` | `number` | Opacité du fond (0-100, surtout pour floating) |
| `headerTextColor` | `string` | Couleur du texte du header (override textColor) |
| `buttonStyle` | `string` | `'rounded'`, `'pill'`, `'square'` |

### 6.3 MobileMenuPanel

Composant réutilisable pour le menu mobile. Side panel droit avec :
- Overlay semi-transparent avec backdrop-blur
- Animation slide-in/out (`translate-x`)
- Logo + nom du restaurant en header
- Navigation avec indicateur de page active
- Bouton panier en footer
- Fermeture via overlay, bouton X, ou touche Escape
- Bloque le scroll du body quand ouvert
- Rendu via `createPortal` dans `document.body`

### 6.4 HomePage

Orchestre les sections de la page d'accueil. Chaque section reçoit ses données via `sections?.{sectionId}`.

```typescript
export function HomePage({ restaurant, theme, ..., sections }: HomePageProps) {
  return (
    <div>
      <HeroSection sectionData={sections?.hero} ... />
      <TwoColumnsSection sectionData={sections?.twoColumns} ... />
      <StatsSection sectionData={sections?.stats} ... />
      <FeaturedSection sectionData={sections?.featured} ... />
      <AboutSection sectionData={sections?.about} ... />
      <GallerySection sectionData={sections?.gallery} ... />
      <TestimonialsSection sectionData={sections?.testimonials} ... />
      <CtaSection sectionData={sections?.cta} ... />
    </div>
  )
}
```

**Important :** Les clés dans `sections?.{key}` doivent correspondre exactement aux `id` définis dans les `sections-config`.

### 6.5 ContactPage

Orchestre les sections de la page contact. Layout en grille 2/5 + 3/5.

```typescript
// Clés de sections : header, contactInfo, form, map
<ContactHeaderSection sectionData={sections?.header} />
<ContactInfoSection sectionData={sections?.contactInfo} />
<ContactFormSection sectionData={sections?.form} />
<ContactMapSection sectionData={sections?.map} />
```

### 6.6 CustomPage

Orchestre les sections des pages personnalisées avec un **ordre configurable**.

```typescript
const DEFAULT_ORDER = ['header', 'content', 'imageText', 'gallery', 'cta']

export function CustomPage({ page, restaurant, theme, sections, sectionOrder }: CustomPageProps) {
  const order = sectionOrder?.length > 0 ? sectionOrder : DEFAULT_ORDER
  return <div>{order.map(renderSection)}</div>
}
```

### 6.7 Hero, MenuSection, RestaurantInfo

Ce sont des **wrappers légers** qui délèguent vers les sections correspondantes de la page menu :

```typescript
// Hero.tsx -> sections/menu/MenuHeroSection.tsx
// MenuSection.tsx -> sections/menu/CatalogSection.tsx
// RestaurantInfo.tsx -> sections/menu/MenuInfoSection.tsx
```

### 6.8 ProductCard

Carte produit utilisée dans le catalogue et les produits en vedette. Reçoit des `sectionOverrides` pour adapter l'affichage selon la config de la section.

### 6.9 ProductModal

Modale de détail produit avec sélection de variantes, modificateurs, quantité, et ajout au panier.

### 6.10 CartDrawer

Drawer latéral du panier avec liste des items, modification des quantités, et bouton de commande.

### 6.11 Footer

Le Footer gère **3 designs** : `standard`, `centered`, `minimal`.

```typescript
export function Footer(props: FooterProps) {
  const design = props.theme.footerDesign || 'standard'
  if (design === 'minimal') return <MinimalFooter {...props} />
  if (design === 'centered') return <CenteredFooter {...props} />
  return <StandardFooter {...props} />
}
```

**Note :** Le Footer n'a pas de `sectionData` car c'est un composant global, pas une section de page. Ses données viennent directement de `theme` et `restaurant`.

---

## 7. Le système de sections et sectionConfig

Le `sectionConfig` est la clé de voute de la personnalisation. Il définit quels champs apparaissent dans l'éditeur de pages pour chaque section.

### Fichier sectionConfig.ts

```typescript
import type { ThemePageSections } from '../_types'
import { homeSections } from './sections-config/home'
import { menuSections } from './sections-config/menu'
import { contactSections } from './sections-config/contact'
import { customSections } from './sections-config/custom'

export const defaultSectionConfig: ThemePageSections = {
  home: homeSections,
  menu: menuSections,
  contact: contactSections,
  custom: customSections,
}
```

### Index par page (ex: sections-config/home/index.ts)

```typescript
import type { ThemeSectionDef } from '../../../_types'
import { heroSection } from './hero'
import { twoColumnsSection } from './two-columns'
// ... autres imports

export const homeSections: ThemeSectionDef[] = [
  heroSection,
  twoColumnsSection,
  statsSection,
  featuredSection,
  aboutSection,
  gallerySection,
  testimonialsSection,
  ctaSection,
]
```

L'**ordre dans le tableau** détermine l'ordre d'affichage des sections dans l'éditeur.

---

## 8. Les sections-config (champs éditeur)

Chaque fichier de section-config exporte un objet `ThemeSectionDef`.

### Structure d'une ThemeSectionDef

```typescript
export const ctaSection: ThemeSectionDef = {
  id: 'cta',                              // ID unique, utilisé comme clé dans sections?.{id}
  label: 'Appel à l\'action',             // Nom affiché dans l'éditeur
  description: 'Bandeau d\'incitation',    // Description sous le nom
  fields: [                                // Liste des champs éditables
    { ... },
    { ... },
  ],
}
```

### Structure d'un SectionFieldDef

```typescript
{
  key: 'buttonText',                       // Clé unique dans la section
  label: 'Texte du bouton',               // Label affiché dans l'éditeur
  type: 'text',                            // Type de champ (voir liste ci-dessous)
  placeholder: 'Commander maintenant',     // Placeholder (pour text/textarea)
  description: 'Texte affiché sur le bouton', // Aide contextuelle
  defaultValue: 'Commander maintenant',    // Valeur par défaut
  options: [                               // Pour type 'select' uniquement
    { value: 'menu', label: 'Page menu' },
    { value: 'contact', label: 'Page contact' },
  ],
  min: 0,                                  // Pour type 'slider'/'number'
  max: 100,                                // Pour type 'slider'/'number'
  step: 5,                                 // Pour type 'slider'/'number'
  showWhen: { field: 'enabled', value: true }, // Affichage conditionnel
}
```

### Types de champs disponibles

| Type | Description | Propriétés spécifiques |
|------|-------------|----------------------|
| `text` | Champ texte simple | `placeholder` |
| `textarea` | Zone de texte multiligne | `placeholder` |
| `color` | Sélecteur de couleur | - |
| `switch` | Toggle on/off | `defaultValue: boolean` |
| `select` | Menu déroulant | `options: { value, label }[]` |
| `number` | Champ numérique | `min`, `max`, `step` |
| `slider` | Curseur numérique | `min`, `max`, `step` |
| `image` | Upload d'image unique | - |
| `gallery` | Upload d'images multiples | - |
| `icon` | Sélecteur d'icone Lucide | - |
| `testimonials` | Éditeur de témoignages | - |
| `separator` | Séparateur visuel (pas de donnée) | - |

### Affichage conditionnel (showWhen)

Le `showWhen` permet de masquer un champ tant qu'une condition n'est pas remplie. La logique est **récursive** : si le champ parent a lui-même un `showWhen`, toute la chaîne est vérifiée.

```typescript
// Le champ n'apparaît que si 'enabled' est true
showWhen: { field: 'enabled', value: true }

// Le champ n'apparaît que si 'style' vaut 'gradient'
showWhen: { field: 'style', value: 'gradient' }

// Chaîne : gradientFrom n'apparaît que si style='gradient' ET enabled=true
{
  key: 'enabled',
  type: 'switch',
  defaultValue: true,
},
{
  key: 'style',
  type: 'select',
  showWhen: { field: 'enabled', value: true },
},
{
  key: 'gradientFrom',
  type: 'color',
  showWhen: { field: 'style', value: 'gradient' },
  // -> Invisible si enabled=false OU style!='gradient'
},
```

### Bonnes pratiques pour les sections-config

1. **Toujours commencer par un champ `enabled`** de type `switch` pour permettre d'activer/désactiver la section
2. **Grouper les champs logiquement** : d'abord les toggles, puis les contenus, puis les styles
3. **Utiliser `showWhen`** pour ne pas surcharger l'éditeur avec des champs inutiles
4. **Fournir des `defaultValue`** pour que la section ait un rendu correct sans configuration
5. **Fournir des `placeholder`** pour guider l'utilisateur
6. **Fournir des `description`** pour les champs non évidents
7. **Les labels et descriptions doivent être en français** avec les accents corrects

---

## 9. Les composants de section (rendu)

Chaque section a un composant de rendu dans `sections/{pageType}/`.

### Pattern standard d'un composant de section

```typescript
'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getIconComponent } from '@/components/shared/IconPicker'
import type { StoreThemeData } from '../../../_types'

interface CtaSectionProps {
  theme: StoreThemeData
  menuHref: string
  contactHref: string
  sectionData?: Record<string, unknown>
}

export function CtaSection({ theme, menuHref, contactHref, sectionData }: CtaSectionProps) {
  // 1. Helper pour lire les données de section avec fallback
  const s = (key: string, fallback?: unknown): unknown => sectionData?.[key] ?? fallback

  // 2. Vérifier si la section est activée
  if (s('enabled', true) === false) return null

  // 3. Lire les valeurs configurées
  const title = s('title', 'Prêt à commander ?') as string
  const subtitle = s('subtitle', 'Parcourez notre menu...') as string
  const buttonText = s('buttonText', 'Commander maintenant') as string
  const BtnIcon = getIconComponent(s('buttonIcon', '') as string) || ArrowRight

  // 4. Calculer les styles dynamiques
  const btnClass = theme.buttonStyle === 'pill'
    ? 'rounded-full'
    : theme.buttonStyle === 'square'
    ? 'rounded-none'
    : 'rounded-xl'

  // 5. Rendu avec les styles du thème
  return (
    <section style={{ backgroundColor: theme.primaryColor }}>
      <h2 style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}>
        {title}
      </h2>
      <Link href={menuHref} className={btnClass}>
        {buttonText}
        <BtnIcon size={14} />
      </Link>
    </section>
  )
}
```

### Règles importantes

1. **Toujours `'use client'`** en haut du fichier (les sections utilisent des données dynamiques)
2. **Le helper `s(key, fallback)`** est le pattern standard pour lire les données de section
3. **Les fallbacks doivent correspondre aux `defaultValue`** des sections-config
4. **Utiliser `theme.primaryColor`, `theme.textColor`, etc.** via `style={{}}` (pas de classes Tailwind pour les couleurs dynamiques)
5. **Utiliser `theme.headingFont`** pour les titres : `fontFamily: \`'${theme.headingFont}', sans-serif\``
6. **Utiliser `theme.buttonStyle`** pour le border-radius des boutons
7. **Respecter le responsive** : mobile-first avec les breakpoints Tailwind (sm, md, lg)

### Correspondance section-config ID <-> sectionData key

La clé utilisée dans `sections?.{key}` dans les pages (HomePage, ContactPage, etc.) doit correspondre au `id` de la section-config :

| Page | Section Config ID | Clé sectionData | Composant |
|------|-------------------|-----------------|-----------|
| **Home** | `hero` | `sections?.hero` | HeroSection |
| | `twoColumns` | `sections?.twoColumns` | TwoColumnsSection |
| | `stats` | `sections?.stats` | StatsSection |
| | `featured` | `sections?.featured` | FeaturedSection |
| | `about` | `sections?.about` | AboutSection |
| | `gallery` | `sections?.gallery` | GallerySection |
| | `testimonials` | `sections?.testimonials` | TestimonialsSection |
| | `cta` | `sections?.cta` | CtaSection |
| **Menu** | `hero` | `sections?.hero` | MenuHeroSection |
| | `catalog` | `sections?.catalog` | CatalogSection |
| | `info` | `sections?.info` | MenuInfoSection |
| **Contact** | `header` | `sections?.header` | ContactHeaderSection |
| | `contactInfo` | `sections?.contactInfo` | ContactInfoSection |
| | `form` | `sections?.form` | ContactFormSection |
| | `map` | `sections?.map` | ContactMapSection |
| **Custom** | `header` | `sections?.header` | CustomHeaderSection |
| | `content` | `sections?.content` | CustomContentSection |
| | `imageText` | `sections?.imageText` | CustomImageTextSection |
| | `gallery` | `sections?.gallery` | CustomGallerySection |
| | `cta` | `sections?.cta` | CustomCtaSection |

---

## 10. Le ThemeProvider et les variables CSS

Fichier : `apps/web/src/components/storefront/providers/ThemeProvider.tsx`

Le `StoreThemeProvider` :
1. **Injecte le thème** via React Context (`useStoreTheme()`)
2. **Définit des variables CSS** sur `:root` pour un accès global
3. **Charge les Google Fonts** dynamiquement
4. **Injecte le CSS personnalisé** (`theme.customCss`)

### Variables CSS disponibles

```css
--store-primary     /* theme.primaryColor */
--store-secondary   /* theme.secondaryColor */
--store-accent      /* theme.accentColor */
--store-bg          /* theme.backgroundColor */
--store-text        /* theme.textColor */
--store-heading-font /* theme.headingFont */
--store-body-font   /* theme.bodyFont */
```

### Valeurs par défaut du thème

```typescript
const DEFAULT_THEME: StoreThemeData = {
  baseTheme: 'default',
  primaryColor: '#FF6B00',
  secondaryColor: '#1A1A1A',
  accentColor: '#FFB800',
  backgroundColor: '#FFFFFF',
  textColor: '#1A1A1A',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  buttonStyle: 'rounded',
  buttonSize: 'md',
  // ... etc
}
```

---

## 11. Le StorefrontShell (orchestrateur)

Fichier : `apps/web/src/components/storefront/StorefrontShell.tsx`

Le `StorefrontShell` est le composant racine qui orchestre tout le storefront. Il :

1. **Récupère les données** via TanStack Query :
   - `api.store.getData(subdomain)` -> restaurant, theme, settings, openingHours, delivery
   - `api.store.getMenu(subdomain)` -> categories avec produits
   - `api.store.getPages(subdomain)` -> pages avec leurs sections

2. **Construit les liens de navigation** (`pageLinks`) :
   ```typescript
   const pageLinks = rawPages.map(p => {
     let href = basePath                              // home
     if (p.pageType === 'menu') href = `${basePath}/menu`
     else if (p.pageType === 'contact') href = `${basePath}/contact`
     else if (p.pageType !== 'home') href = `${basePath}/${p.slug}`
     return { slug: p.slug, title: p.title, pageType: p.pageType, href }
   })
   ```

3. **Charge les composants du thème** :
   ```typescript
   useEffect(() => {
     loadThemeComponents(themeId).then(setComponents)
   }, [themeId])
   ```

4. **Rend la page appropriée** selon la prop `page` (`'home'`, `'menu'`, `'contact'`, `'custom'`)

5. **Passe `currentPath={pathname}`** au Header pour la navigation active

---

## 12. Les données disponibles (props)

### StoreThemeData - Propriétés complètes

| Propriété | Type | Utilisation |
|-----------|------|-------------|
| `primaryColor` | `string` | Couleur principale (boutons, accents, liens actifs) |
| `secondaryColor` | `string` | Couleur secondaire |
| `accentColor` | `string` | Couleur d'accent (badges, notifications) |
| `backgroundColor` | `string` | Fond de page |
| `textColor` | `string` | Couleur du texte principal |
| `headingFont` | `string` | Police des titres (Google Fonts) |
| `bodyFont` | `string` | Police du corps (Google Fonts) |
| `buttonStyle` | `string` | `'rounded'` / `'pill'` / `'square'` |
| `buttonSize` | `string` | `'sm'` / `'md'` / `'lg'` |
| `headerDesign` | `string` | `'standard'` / `'centered'` / `'floating'` |
| `headerSticky` | `boolean` | Header fixe au scroll |
| `headerBgOpacity` | `number` | Opacité du fond header (0-100) |
| `headerTextColor` | `string` | Override couleur texte header |
| `logoPosition` | `string` | `'left'` / `'center'` |
| `footerDesign` | `string` | `'standard'` / `'centered'` / `'minimal'` |
| `heroStyle` | `string` | Style du hero |
| `heroOverlayOpacity` | `number` | Opacité overlay hero |
| `heroTitle` | `string \| null` | Titre hero (override) |
| `heroSubtitle` | `string \| null` | Sous-titre hero (override) |
| `heroCtaText` | `string \| null` | Texte CTA hero |
| `announcementActive` | `boolean` | Barre d'annonce active |
| `announcementText` | `string \| null` | Texte de l'annonce |
| `announcementBgColor` | `string \| null` | Couleur fond annonce |
| `socialLinks` | `Record<string, string> \| null` | Liens réseaux sociaux |
| `customCss` | `string \| null` | CSS personnalisé |

### StoreRestaurantData

| Propriété | Type |
|-----------|------|
| `id` | `string` |
| `name` | `string` |
| `description` | `string \| null` |
| `shortDescription` | `string \| null` |
| `logo` | `string \| null` |
| `coverImage` | `string \| null` |
| `images` | `string[]` |
| `address` | `string` |
| `addressLine2` | `string \| null` |
| `city` | `string` |
| `postalCode` | `string` |
| `country` | `string` |
| `latitude` | `number \| null` |
| `longitude` | `number \| null` |
| `phone` | `string` |
| `email` | `string` |
| `website` | `string \| null` |
| `businessType` | `string` |
| `cuisineTypes` | `string[]` |

---

## 13. Conventions de style et responsive

### Couleurs

**Ne jamais utiliser de classes Tailwind pour les couleurs dynamiques.** Utiliser `style={{}}` :

```tsx
// BON
<div style={{ backgroundColor: theme.primaryColor, color: theme.textColor }}>

// MAUVAIS
<div className="bg-orange-500 text-gray-900">
```

Les classes Tailwind sont utilisées uniquement pour :
- Les opacités : `opacity-60`, `opacity-40`
- Les couleurs dérivées avec hex : `${theme.primaryColor}15` (15 = opacité hex)
- Les couleurs fixes : `text-white`, `bg-black/40`

### Opacités hex courantes

```
05 = 2%    08 = 3%    10 = 6%    15 = 8%
20 = 13%   25 = 15%   30 = 19%   40 = 25%
50 = 31%   60 = 38%   80 = 50%
```

### Polices

```tsx
// Titres
style={{ fontFamily: `'${theme.headingFont}', sans-serif` }}

// Corps (géré par le ThemeProvider, pas besoin de le spécifier sauf override)
style={{ fontFamily: `'${theme.bodyFont}', sans-serif` }}
```

### Boutons

Toujours respecter le `buttonStyle` du thème :

```typescript
const btnClass = theme.buttonStyle === 'pill'
  ? 'rounded-full'
  : theme.buttonStyle === 'square'
  ? 'rounded-none'
  : 'rounded-xl'
```

### Responsive

Mobile-first avec les breakpoints Tailwind :

```
sm: 640px   md: 768px   lg: 1024px   xl: 1280px
```

Patterns courants :
```tsx
// Grilles
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"

// Padding
className="px-4 sm:px-6"
className="py-10 sm:py-14"

// Texte
className="text-2xl sm:text-3xl lg:text-4xl"

// Flexbox
className="flex flex-col sm:flex-row"

// Masquer/afficher
className="hidden md:flex"     // Desktop uniquement
className="md:hidden"          // Mobile uniquement
```

### Container max-width

Toujours utiliser `max-w-7xl mx-auto px-4 sm:px-6` pour le conteneur principal.

---

## 14. Gestion des icones personnalisables

Le système permet aux utilisateurs de choisir des icones Lucide via un sélecteur visuel.

### Dans la section-config

```typescript
{
  key: 'buttonIcon',
  label: 'Icone du bouton',
  type: 'icon',
  description: 'Icone affichée dans le bouton (par défaut : flèche)',
  showWhen: { field: 'enabled', value: true },
}
```

### Dans le composant de section

```typescript
import { ArrowRight } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'

// Résoudre l'icone avec fallback
const BtnIcon = getIconComponent(s('buttonIcon', '') as string) || ArrowRight

// Utiliser dans le JSX
<BtnIcon size={14} />
```

### Pattern pour les cartes avec icones multiples

```typescript
import { MapPin, Clock, Truck, Phone } from 'lucide-react'
import { getIconComponent } from '@/components/shared/IconPicker'

const AddressIcon = getIconComponent(s('addressIcon', '') as string) || MapPin
const HoursIcon = getIconComponent(s('hoursIcon', '') as string) || Clock
const DeliveryIcon = getIconComponent(s('deliveryIcon', '') as string) || Truck
const PhoneIcon = getIconComponent(s('phoneIcon', '') as string) || Phone
```

### Sections avec icones personnalisables (thème default)

| Section | Champs icone | Icone par défaut |
|---------|-------------|------------------|
| Hero | `ctaIcon`, `secondaryBtnIcon` | ArrowRight |
| TwoColumns | `btnIcon` | ArrowRight |
| Stats | `iconLayout` (top/left) | - |
| Featured | `orderBtnIcon` | ArrowRight |
| About | `addressIcon`, `hoursIcon`, `deliveryIcon`, `phoneIcon` | MapPin, Clock, Truck, Phone |
| Testimonials | `quoteIcon` | Quote |
| CTA | `buttonIcon` | ArrowRight |
| Custom CTA | `buttonIcon` | ArrowRight |
| Custom ImageText | `buttonIcon` | ArrowRight |
| Contact Info | `addressIcon`, `phoneIcon`, `emailIcon`, `websiteIcon`, `deliveryIcon`, `hoursIcon` | MapPin, Phone, Mail, Globe, Truck, Clock |
| Contact Form | `submitBtnIcon` | Send |
| Menu Info | `addressIcon`, `phoneIcon`, `deliveryIcon`, `hoursIcon` | MapPin, Phone, Truck, Clock |

---

## 15. Le Header : navigation et menu mobile

### Structure de la navigation

Les pages sont fournies via `pages: StorePageLink[]` avec :
- `slug` : identifiant unique de la page
- `title` : titre affiché dans la navigation
- `pageType` : `'home'`, `'menu'`, `'contact'`, ou `null` (page custom)
- `href` : URL complète (ex: `/store/demo`, `/store/demo/menu`)

### Menu mobile (MobileMenuPanel)

Le composant `MobileMenuPanel` est un composant séparé et réutilisable. Il reçoit :

```typescript
interface MobileMenuPanelProps {
  isOpen: boolean
  onClose: () => void
  pages: HeaderProps['pages']
  restaurant: HeaderProps['restaurant']
  theme: HeaderProps['theme']
  isActive: (href: string) => boolean
  cartItemCount: number
  onCartClick: () => void
  btnClass: string
}
```

**Points techniques :**
- Utilise `createPortal(jsx, document.body)` pour éviter les problèmes de z-index
- `z-[9998]` pour l'overlay, `z-[9999]` pour le panel
- `document.body.style.overflow = 'hidden'` quand ouvert
- Écoute la touche Escape pour fermer

---

## 16. Le Footer : designs multiples

Le Footer supporte 3 designs via `theme.footerDesign` :

1. **standard** : 3 colonnes (logo+social, contact, horaires)
2. **centered** : tout centré (logo, texte, contact inline, social)
3. **minimal** : une seule ligne (nom + contact + social)

Le Footer contient des sous-composants internes :
- `LogoBlock` : logo ou initiales + nom
- `SocialLinks` : liens réseaux sociaux
- `ContactInfo` : adresse, téléphone, email, site web
- `OpeningHoursBlock` : horaires d'ouverture
- `PoweredBy` : mention "Propulsé par IziResto"

**Note :** Le Footer n'utilise pas le système de sections-config. Ses données viennent directement des props `restaurant`, `theme`, et `openingHours`.

---

## 17. Checklist de création d'un nouveau thème

### Étape 1 : Créer le dossier

```
themes/{monTheme}/
```

### Étape 2 : Créer les sections-config

Pour chaque page (home, menu, contact, custom) :
1. Créer les fichiers de config dans `sections-config/{page}/{section}.ts`
2. Créer l'index `sections-config/{page}/index.ts` qui exporte le tableau
3. Créer `sectionConfig.ts` qui agrège toutes les pages

**Chaque section doit avoir au minimum :**
- Un champ `enabled` de type `switch`
- Des `defaultValue` pour un rendu correct sans configuration

### Étape 3 : Créer les composants de section

Pour chaque section-config, créer le composant correspondant dans `sections/{page}/`.

**Chaque composant doit :**
- Avoir `'use client'` en haut
- Accepter `sectionData?: Record<string, unknown>`
- Utiliser le helper `s(key, fallback)`
- Vérifier `if (s('enabled', true) === false) return null`
- Utiliser les couleurs du thème via `style={{}}`
- Être responsive (mobile-first)

### Étape 4 : Créer les composants de page

- `HomePage.tsx` : orchestre les sections home
- `ContactPage.tsx` : orchestre les sections contact
- `CustomPage.tsx` : orchestre les sections custom avec ordre configurable

### Étape 5 : Créer les composants globaux

- `Header.tsx` : avec les 3 designs (standard, centered, floating)
- `MobileMenuPanel.tsx` : menu mobile side panel
- `Footer.tsx` : avec les 3 designs (standard, centered, minimal)
- `AnnouncementBar.tsx` : barre d'annonce
- `Hero.tsx` : wrapper pour MenuHeroSection
- `MenuSection.tsx` : wrapper pour CatalogSection
- `RestaurantInfo.tsx` : wrapper pour MenuInfoSection
- `ProductCard.tsx` : carte produit
- `ProductModal.tsx` : modale produit
- `CartDrawer.tsx` : drawer panier

### Étape 6 : Créer le fichier d'entrée

`index.ts` qui exporte `default` un objet `ThemeComponents` complet.

### Étape 7 : Enregistrer dans le registre

Ajouter une entrée dans `_registry.ts` avec les métadonnées et le `load()`.

### Étape 8 : Ajouter l'image de prévisualisation

Ajouter une image dans `/public/themes/{monTheme}-preview.png`.

### Étape 9 : Tester

- [ ] Toutes les pages s'affichent (home, menu, contact, custom)
- [ ] L'éditeur de pages affiche tous les champs
- [ ] Les modifications dans l'éditeur se reflètent en temps réel
- [ ] Le responsive fonctionne (mobile, tablette, desktop)
- [ ] La navigation active fonctionne correctement
- [ ] Le menu mobile s'ouvre et se ferme correctement
- [ ] Le panier fonctionne (ajout, modification, suppression)
- [ ] La modale produit fonctionne (variantes, modificateurs)
- [ ] Les 3 designs de header fonctionnent
- [ ] Les 3 designs de footer fonctionnent
- [ ] Les icones personnalisables fonctionnent
- [ ] Les polices Google Fonts se chargent
- [ ] Le CSS personnalisé s'applique
- [ ] La barre d'annonce s'affiche/se masque

---

## 18. Erreurs courantes à éviter

### Navigation

- **Ne pas utiliser `startsWith` pour la page home** dans `isActive` : `/store/demo/` est un préfixe de toutes les sous-pages. Toujours vérifier `pageType === 'home'` et ne faire qu'un match exact.

### Sections

- **Ne pas oublier le `enabled` check** : `if (s('enabled', true) === false) return null`
- **Ne pas oublier les fallbacks** dans le helper `s()` : sans fallback, la section peut crasher
- **Les IDs de section doivent être uniques** par page et correspondre aux clés dans `sections?.{id}`
- **Ne pas confondre les IDs** : l'ID dans la section-config (`id: 'cta'`) doit correspondre à la clé utilisée dans la page (`sections?.cta`)

### Styles

- **Ne jamais hardcoder les couleurs** : toujours utiliser `theme.primaryColor`, `theme.textColor`, etc.
- **Ne jamais hardcoder les polices** : toujours utiliser `theme.headingFont`, `theme.bodyFont`
- **Ne jamais hardcoder le border-radius des boutons** : toujours utiliser `theme.buttonStyle`
- **Ne pas oublier le responsive** : tester sur mobile, tablette et desktop

### Icones

- **Toujours fournir un fallback** : `getIconComponent(s('icon', '') as string) || DefaultIcon`
- **Importer l'icone par défaut** depuis `lucide-react` pour le fallback
- **Importer `getIconComponent`** depuis `@/components/shared/IconPicker`

### TypeScript

- **Tous les composants doivent être typés** avec les interfaces de `_types.ts`
- **Pas de `any`** : utiliser les types appropriés
- **Les props `sectionData`** sont toujours `Record<string, unknown> | undefined`

### Textes

- **Tous les textes visibles doivent être en français** avec les accents corrects
- **Ne pas utiliser d'emojis** : utiliser des icones Lucide
- **Les labels et descriptions des champs éditeur** doivent être clairs et concis

### Performance

- **Utiliser `'use client'`** uniquement quand nécessaire (interactivité, hooks)
- **Le lazy loading est géré par le registre** : ne pas importer les thèmes directement
- **Les images doivent utiliser `object-cover`** pour un rendu uniforme
