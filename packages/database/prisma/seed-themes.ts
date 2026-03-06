import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding themes...')

  const themes = [
    {
      slug: 'default',
      name: 'Moderne',
      description: 'Un design moderne et polyvalent, adapté à tous les types de restaurants. Hero personnalisable avec image, vidéo ou dégradé, menu responsive en grille ou liste, section contact avec carte interactive, et pied de page configurable.',
      shortDescription: 'Design moderne et polyvalent pour tous les restaurants',
      version: '1.0.0',
      author: 'IziResto',
      category: 'UNIVERSAL' as const,
      tags: ['moderne', 'polyvalent', 'responsive', 'personnalisable'],
      isPremium: false,
      isActive: true,
      isFeatured: true,
      installCount: 0,
      rating: 0,
      ratingCount: 0,
      features: [
        'Hero personnalisable (image, vidéo, dégradé)',
        'Menu responsive grille/liste',
        'Panier et commande intégrés',
        'Section contact avec carte',
        'Pages personnalisées',
        'Header et footer configurables',
        'Bannières promotionnelles',
        'Badges livraison et préparation',
      ],
      colorPresets: {
        primaryColor: '#FF6B00',
        secondaryColor: '#1A1A1A',
        accentColor: '#FFB800',
        backgroundColor: '#FFFFFF',
        textColor: '#1A1A1A',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        buttonStyle: 'rounded',
        headerDesign: 'standard',
        footerDesign: 'standard',
      },
      supportedPages: ['home', 'menu', 'contact', 'custom'],
    },
    {
      slug: 'feasto',
      name: 'Feasto',
      description: 'Un design sombre et élégant avec des accents dorés, parfait pour les restaurants haut de gamme. Hero immersif, sections qualité et galerie sociale, menu avec catégories filtrables, timeline et équipe pour les pages personnalisées.',
      shortDescription: 'Design sombre et élégant pour restaurants premium',
      version: '1.0.0',
      author: 'IziResto',
      category: 'FINE_DINING' as const,
      tags: ['sombre', 'élégant', 'premium', 'dark', 'doré'],
      isPremium: false,
      isActive: true,
      isFeatured: true,
      installCount: 0,
      rating: 0,
      ratingCount: 0,
      features: [
        'Hero immersif avec fond sombre',
        'Section qualité avec statistiques',
        'Deux colonnes texte/image alternées',
        'Menu filtrable par catégorie',
        'Galerie sociale Instagram',
        'Barre d\'informations pratiques',
        'Timeline et équipe pour pages custom',
        'Design dark premium',
      ],
      colorPresets: {
        primaryColor: '#C8A97E',
        secondaryColor: '#1A1A1A',
        accentColor: '#E74C3C',
        backgroundColor: '#0C0C0C',
        textColor: '#FFFFFF',
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        buttonStyle: 'rounded',
        headerDesign: 'floating',
        footerDesign: 'standard',
      },
      supportedPages: ['home', 'menu', 'contact', 'custom'],
    },
  ]

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { slug: theme.slug },
      update: {
        colorPresets: theme.colorPresets,
        features: theme.features,
        description: theme.description,
        shortDescription: theme.shortDescription,
      },
      create: theme,
    })
    console.log(`  Upserted theme: ${theme.name}`)
  }

  console.log(`\nSeeded ${themes.length} themes successfully!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
