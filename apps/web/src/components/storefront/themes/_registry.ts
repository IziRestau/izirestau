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
  feasto: {
    meta: {
      id: 'feasto',
      name: 'Feasto',
      description: 'Un design sombre et élégant avec des accents dorés, parfait pour les restaurants haut de gamme',
      preview: '/themes/feasto-preview.png',
      tags: ['sombre', 'élégant', 'premium', 'dark'],
    },
    load: () => import('./feasto'),
  },
}

export function getThemeMeta(themeId: string): ThemeMeta | null {
  return THEME_REGISTRY[themeId]?.meta ?? null
}

export function getAllThemes(): ThemeMeta[] {
  return Object.values(THEME_REGISTRY).map(entry => entry.meta)
}

export async function loadThemeComponents(themeId: string): Promise<ThemeComponents> {
  const entry = THEME_REGISTRY[themeId] ?? THEME_REGISTRY['default']
  const mod = await entry.load()
  return mod.default
}
