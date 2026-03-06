---
description: Regle stricte de responsivite pour toutes les pages
---

# Regle de Responsivite - OBLIGATOIRE

Toutes les nouvelles pages et composants DOIVENT etre responsives. Cette regle est **non-negociable**.

## Breakpoints Tailwind a utiliser

| Breakpoint | Min-width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Mobile large |
| `md:` | 768px | Tablette |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Desktop large |

## Regles strictes

### 1. Grilles
- Utiliser `grid-cols-1` par defaut (mobile)
- Ajouter `sm:grid-cols-2`, `lg:grid-cols-3`, `xl:grid-cols-4` selon le contenu
- Exemple: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`

### 2. Flexbox
- Utiliser `flex-col` par defaut sur mobile
- Ajouter `sm:flex-row` ou `md:flex-row` pour desktop
- Exemple: `flex flex-col sm:flex-row gap-4`

### 3. Espacements
- Padding: `p-4 lg:p-6`
- Gap: `gap-4 lg:gap-6`
- Marges: `mb-4 lg:mb-6`

### 4. Textes
- Titres: `text-xl lg:text-2xl`
- Sous-titres: `text-base lg:text-lg`
- Corps: `text-sm lg:text-base`

### 5. Tableaux
- TOUJOURS wrapper dans `overflow-x-auto`
- Sur mobile, considerer une vue en cartes avec `hidden sm:table` et `sm:hidden` pour alterner

### 6. Boutons et actions
- Full width sur mobile: `w-full sm:w-auto`
- Icones seules sur mobile si necessaire: `<span className="hidden sm:inline">Texte</span>`

### 7. Navigation et sidebars
- Sidebar cachee sur mobile avec toggle
- Menu hamburger sur mobile

### 8. Images
- Toujours utiliser `next/image` avec `fill` ou dimensions responsives
- `sizes` prop obligatoire pour optimisation

### 9. Modals et Dialogs
- Full screen sur mobile: `w-full sm:max-w-md`
- Padding reduit: `p-4 sm:p-6`

## Checklist avant commit

- [ ] Tester sur viewport 320px (mobile petit)
- [ ] Tester sur viewport 768px (tablette)
- [ ] Tester sur viewport 1024px (desktop)
- [ ] Verifier le scroll horizontal (INTERDIT sauf tableaux)
- [ ] Verifier les textes tronques
- [ ] Verifier les boutons accessibles au touch (min 44px)

## Exemple de page responsive

```tsx
<div className="p-4 lg:p-6">
  {/* Stats Cards */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6">
    <StatsCard ... />
  </div>

  {/* Search + Actions */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <input className="w-full sm:max-w-md" />
    <button className="w-full sm:w-auto">Action</button>
  </div>

  {/* Table avec scroll horizontal */}
  <div className="overflow-x-auto">
    <table className="w-full min-w-[600px]">...</table>
  </div>
</div>
```
