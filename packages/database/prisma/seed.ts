import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('Demo1234!', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@iziresto.com' },
    update: { isSuperAdmin: true },
    create: {
      email: 'admin@iziresto.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'IziResto',
      userType: 'SUPER_ADMIN',
      isSuperAdmin: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  console.log('Created admin user:', adminUser.email)

  const resellerUser = await prisma.user.upsert({
    where: { email: 'demo@iziresto.com' },
    update: {},
    create: {
      email: 'demo@iziresto.com',
      passwordHash,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33 6 12 34 56 78',
      userType: 'RESELLER',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  console.log('Created reseller user:', resellerUser.email)

  const starterPlan = await prisma.licensePlan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter',
      slug: 'starter',
      description: 'Ideal pour demarrer avec quelques restaurants',
      maxSites: 5,
      maxUsersPerSite: 3,
      features: ['Support email', 'Tableau de bord basique', 'Rapports mensuels'],
      hasCustomDomain: false,
      hasAdvancedAnalytics: false,
      hasPrioritySupport: false,
      hasWhiteLabel: false,
      hasApiAccess: false,
      priceMonthly: 49,
      priceYearly: 490,
      currency: 'EUR',
      isActive: true,
      isPopular: false,
      sortOrder: 1,
    },
  })

  const proPlan = await prisma.licensePlan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro',
      slug: 'pro',
      description: 'Pour les agences en croissance',
      maxSites: 20,
      maxUsersPerSite: 5,
      features: ['Support prioritaire', 'Analytics avances', 'Domaine personnalise', 'Rapports hebdomadaires'],
      hasCustomDomain: true,
      hasAdvancedAnalytics: true,
      hasPrioritySupport: true,
      hasWhiteLabel: false,
      hasApiAccess: false,
      priceMonthly: 99,
      priceYearly: 990,
      currency: 'EUR',
      isActive: true,
      isPopular: true,
      sortOrder: 2,
    },
  })

  const businessPlan = await prisma.licensePlan.upsert({
    where: { slug: 'business' },
    update: {},
    create: {
      name: 'Business',
      slug: 'business',
      description: 'Solution complete pour les grandes agences',
      maxSites: 50,
      maxUsersPerSite: 10,
      features: ['Support dedie', 'White-label complet', 'API access', 'Rapports personnalises', 'Formation incluse'],
      hasCustomDomain: true,
      hasAdvancedAnalytics: true,
      hasPrioritySupport: true,
      hasWhiteLabel: true,
      hasApiAccess: true,
      priceMonthly: 199,
      priceYearly: 1990,
      currency: 'EUR',
      isActive: true,
      isPopular: false,
      sortOrder: 3,
    },
  })

  console.log('Created license plans:', starterPlan.name, proPlan.name, businessPlan.name)

  // License Pro pour Demo Agency
  const license = await prisma.license.upsert({
    where: { id: 'demo-license' },
    update: {},
    create: {
      id: 'demo-license',
      planId: proPlan.id,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      paymentProvider: 'STRIPE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sitesUsed: 2,
    },
  })

  // License Starter pour Test Agency
  const licenseStarter = await prisma.license.upsert({
    where: { id: 'starter-license' },
    update: {},
    create: {
      id: 'starter-license',
      planId: starterPlan.id,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      paymentProvider: 'STRIPE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sitesUsed: 1,
    },
  })

  console.log('Created licenses:', license.id, licenseStarter.id)

  const organization = await prisma.resellerOrganization.upsert({
    where: { slug: 'demo-agency' },
    update: {},
    create: {
      name: 'Demo Agency',
      slug: 'demo-agency',
      email: 'contact@demo-agency.com',
      phone: '+33 1 23 45 67 89',
      website: 'https://demo-agency.com',
      address: '123 Rue de la Demo',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
      businessName: 'Demo Agency SARL',
      siret: '12345678901234',
      vatNumber: 'FR12345678901',
      logo: null,
      primaryColor: '#10B981',
      status: 'ACTIVE',
      isActive: true,
      licenseId: license.id,
    },
  })

  console.log('Created organization:', organization.name)

  const resellerMember = await prisma.resellerMember.upsert({
    where: { userId: resellerUser.id },
    update: {},
    create: {
      organizationId: organization.id,
      userId: resellerUser.id,
      role: 'OWNER',
      permissions: ['*'],
      isActive: true,
      joinedAt: new Date(),
    },
  })

  console.log('Created reseller member:', resellerMember.role)

  // Create second reseller user with Starter license
  const resellerUser2 = await prisma.user.upsert({
    where: { email: 'test@iziresto.com' },
    update: {},
    create: {
      email: 'test@iziresto.com',
      passwordHash,
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '+33 6 55 44 33 22',
      userType: 'RESELLER',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  console.log('Created second reseller user:', resellerUser2.email)

  const organization2 = await prisma.resellerOrganization.upsert({
    where: { slug: 'test-agency' },
    update: {},
    create: {
      name: 'Test Agency',
      slug: 'test-agency',
      email: 'contact@test-agency.com',
      phone: '+33 1 98 76 54 32',
      website: 'https://test-agency.com',
      address: '456 Avenue du Test',
      city: 'Lyon',
      postalCode: '69001',
      country: 'FR',
      businessName: 'Test Agency SAS',
      siret: '98765432101234',
      vatNumber: 'FR98765432101',
      logo: null,
      primaryColor: '#3B82F6',
      status: 'ACTIVE',
      isActive: true,
      licenseId: licenseStarter.id,
    },
  })

  console.log('Created second organization:', organization2.name)

  const resellerMember2 = await prisma.resellerMember.upsert({
    where: { userId: resellerUser2.id },
    update: {},
    create: {
      organizationId: organization2.id,
      userId: resellerUser2.id,
      role: 'OWNER',
      permissions: ['*'],
      isActive: true,
      joinedAt: new Date(),
    },
  })

  console.log('Created second reseller member:', resellerMember2.role)

  // Create a Client for the restaurant owner
  const client = await prisma.client.upsert({
    where: { 
      organizationId_email: {
        organizationId: organization.id,
        email: 'mario@pizzamario.com'
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Pizza Mario',
      contactFirstName: 'Mario',
      contactLastName: 'Rossi',
      email: 'mario@pizzamario.com',
      phone: '+33 6 98 76 54 32',
      businessName: 'Pizza Mario SARL',
      status: 'ACTIVE',
      source: 'MANUAL',
    },
  })

  console.log('Created client:', client.email)

  // Create Restaurant User
  const restaurantUser = await prisma.user.upsert({
    where: { email: 'mario@pizzamario.com' },
    update: {},
    create: {
      email: 'mario@pizzamario.com',
      passwordHash,
      firstName: 'Mario',
      lastName: 'Rossi',
      phone: '+33 6 98 76 54 32',
      userType: 'RESTAURANT',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  console.log('Created restaurant user:', restaurantUser.email)

  // Create Restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'demo-restaurant' },
    update: {},
    create: {
      id: 'demo-restaurant',
      name: 'Pizza Mario',
      description: 'La meilleure pizzeria italienne de Paris. Pizzas artisanales cuites au feu de bois avec des ingredients frais importes d\'Italie.',
      shortDescription: 'Pizzeria italienne authentique',
      email: 'contact@pizzamario.com',
      phone: '+33 1 42 33 44 55',
      website: 'https://pizzamario.iziresto.com',
      address: '42 Rue de la Pizza',
      city: 'Paris',
      postalCode: '75011',
      country: 'FR',
      latitude: 48.8566,
      longitude: 2.3522,
      businessName: 'Pizza Mario SARL',
      siret: '98765432109876',
      vatNumber: 'FR98765432109',
      businessType: 'PIZZERIA',
      cuisineTypes: ['Italian', 'Pizza', 'Pasta'],
    },
  })

  console.log('Created restaurant:', restaurant.name)

  // Create Restaurant Settings
  await prisma.restaurantSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      currency: 'EUR',
      language: 'fr',
      timezone: 'Europe/Paris',
      orderPrefix: 'PM',
      autoAcceptOrders: false,
      avgPrepTime: 25,
      acceptCash: true,
      acceptCard: true,
      acceptOnlinePayment: true,
      tipsEnabled: true,
      suggestedTips: [10, 15, 20],
    },
  })

  // Create Site for the restaurant
  const site = await prisma.site.upsert({
    where: { subdomain: 'pizzamario' },
    update: {},
    create: {
      organizationId: organization.id,
      clientId: client.id,
      subdomain: 'pizzamario',
      status: 'ACTIVE',
      isActive: true,
      restaurantId: restaurant.id,
      publishedAt: new Date(),
    },
  })

  console.log('Created site:', site.subdomain)

  // Create Restaurant Staff (link user to restaurant)
  const restaurantStaff = await prisma.restaurantStaff.upsert({
    where: { userId: restaurantUser.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      userId: restaurantUser.id,
      role: 'OWNER',
      position: 'Proprietaire',
      isActive: true,
      permissions: ['*'],
    },
  })

  console.log('Created restaurant staff:', restaurantStaff.role)

  // Create some menu categories
  const categoryPizzas = await prisma.category.upsert({
    where: { restaurantId_slug: { restaurantId: restaurant.id, slug: 'pizzas' } },
    update: {},
    create: {
      id: 'cat-pizzas',
      restaurantId: restaurant.id,
      name: 'Pizzas',
      slug: 'pizzas',
      description: 'Nos pizzas artisanales',
      sortOrder: 1,
      isActive: true,
    },
  })

  const categoryPastas = await prisma.category.upsert({
    where: { restaurantId_slug: { restaurantId: restaurant.id, slug: 'pates' } },
    update: {},
    create: {
      id: 'cat-pastas',
      restaurantId: restaurant.id,
      name: 'Pates',
      slug: 'pates',
      description: 'Pates fraiches maison',
      sortOrder: 2,
      isActive: true,
    },
  })

  const categoryDesserts = await prisma.category.upsert({
    where: { restaurantId_slug: { restaurantId: restaurant.id, slug: 'desserts' } },
    update: {},
    create: {
      id: 'cat-desserts',
      restaurantId: restaurant.id,
      name: 'Desserts',
      slug: 'desserts',
      description: 'Desserts maison',
      sortOrder: 3,
      isActive: true,
    },
  })

  console.log('Created categories:', categoryPizzas.name, categoryPastas.name, categoryDesserts.name)

  // Create some products
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'prod-margherita',
        restaurantId: restaurant.id,
        categoryId: categoryPizzas.id,
        name: 'Margherita',
        slug: 'margherita',
        description: 'Tomate, mozzarella, basilic frais',
        price: 12.50,
        isActive: true,
        sortOrder: 1,
      },
      {
        id: 'prod-4fromages',
        restaurantId: restaurant.id,
        categoryId: categoryPizzas.id,
        name: 'Quattro Formaggi',
        slug: 'quattro-formaggi',
        description: 'Mozzarella, gorgonzola, parmesan, chevre',
        price: 15.00,
        isActive: true,
        sortOrder: 2,
      },
      {
        id: 'prod-diavola',
        restaurantId: restaurant.id,
        categoryId: categoryPizzas.id,
        name: 'Diavola',
        slug: 'diavola',
        description: 'Tomate, mozzarella, salami piquant, piments',
        price: 14.00,
        isActive: true,
        sortOrder: 3,
      },
      {
        id: 'prod-carbonara',
        restaurantId: restaurant.id,
        categoryId: categoryPastas.id,
        name: 'Spaghetti Carbonara',
        slug: 'spaghetti-carbonara',
        description: 'Guanciale, oeuf, pecorino, poivre noir',
        price: 14.50,
        isActive: true,
        sortOrder: 1,
      },
      {
        id: 'prod-bolognese',
        restaurantId: restaurant.id,
        categoryId: categoryPastas.id,
        name: 'Tagliatelle Bolognese',
        slug: 'tagliatelle-bolognese',
        description: 'Sauce bolognaise traditionnelle, parmesan',
        price: 13.50,
        isActive: true,
        sortOrder: 2,
      },
      {
        id: 'prod-tiramisu',
        restaurantId: restaurant.id,
        categoryId: categoryDesserts.id,
        name: 'Tiramisu',
        slug: 'tiramisu',
        description: 'Dessert italien traditionnel',
        price: 7.50,
        isActive: true,
        sortOrder: 1,
      },
    ],
  })

  console.log('Created products')

  // Create Client Subscription for Pizza Mario
  const subscription = await prisma.clientSubscription.upsert({
    where: { id: 'sub-pizzamario' },
    update: {},
    create: {
      id: 'sub-pizzamario',
      organizationId: organization.id,
      clientId: client.id,
      name: 'Abonnement Site Web',
      description: 'Abonnement mensuel pour le site de commande en ligne',
      amount: 79.00,
      currency: 'EUR',
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
      startDate: new Date('2024-09-01'),
      nextBillingDate: new Date('2025-02-01'),
    },
  })

  console.log('Created subscription:', subscription.name)

  // Create invoices for the past months
  const invoicesData = [
    { month: '2024-09', status: 'PAID', paidAt: new Date('2024-09-05') },
    { month: '2024-10', status: 'PAID', paidAt: new Date('2024-10-03') },
    { month: '2024-11', status: 'PAID', paidAt: new Date('2024-11-07') },
    { month: '2024-12', status: 'PAID', paidAt: new Date('2024-12-04') },
    { month: '2025-01', status: 'PENDING', paidAt: null },
  ]

  for (let i = 0; i < invoicesData.length; i++) {
    const inv = invoicesData[i]
    const [year, month] = inv.month.split('-').map(Number)
    const issueDate = new Date(year, month - 1, 1)
    const dueDate = new Date(year, month - 1, 15)
    
    const subtotal = 79.00
    const taxRate = 20
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    await prisma.clientInvoice.upsert({
      where: { 
        organizationId_invoiceNumber: {
          organizationId: organization.id,
          invoiceNumber: `INV-${inv.month.replace('-', '')}-001`
        }
      },
      update: {},
      create: {
        organizationId: organization.id,
        clientId: client.id,
        subscriptionId: subscription.id,
        invoiceNumber: `INV-${inv.month.replace('-', '')}-001`,
        issueDate,
        dueDate,
        subtotal,
        taxRate,
        taxAmount,
        total,
        status: inv.status === 'PAID' ? 'PAID' : 'SENT',
        paidAmount: inv.status === 'PAID' ? total : 0,
        paidAt: inv.paidAt,
        items: {
          create: [
            {
              description: 'Abonnement Site Web - ' + new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
              quantity: 1,
              unitPrice: subtotal,
              total: subtotal,
            }
          ]
        }
      },
    })
  }

  console.log('Created invoices for Pizza Mario')

  // Create some client interactions
  await prisma.clientInteraction.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'interaction-1',
        clientId: client.id,
        type: 'NOTE',
        subject: 'Premier contact',
        content: 'Client interesse par notre solution. A decouvert IziResto via une recommandation.',
        performedBy: 'Jean Dupont',
        createdAt: new Date('2024-08-15'),
      },
      {
        id: 'interaction-2',
        clientId: client.id,
        type: 'CALL',
        subject: 'Demo du produit',
        content: 'Presentation complete de la plateforme. Le client est convaincu et souhaite demarrer rapidement.',
        performedBy: 'Jean Dupont',
        createdAt: new Date('2024-08-20'),
      },
      {
        id: 'interaction-3',
        clientId: client.id,
        type: 'EMAIL',
        subject: 'Envoi du contrat',
        content: 'Contrat envoye par email. En attente de signature.',
        performedBy: 'Jean Dupont',
        createdAt: new Date('2024-08-25'),
      },
      {
        id: 'interaction-4',
        clientId: client.id,
        type: 'NOTE',
        subject: 'Mise en ligne',
        content: 'Site mis en ligne avec succes. Le client est tres satisfait du resultat.',
        performedBy: 'Jean Dupont',
        createdAt: new Date('2024-09-01'),
      },
    ],
  })

  console.log('Created client interactions')

  // Update client notes
  await prisma.client.update({
    where: { id: client.id },
    data: {
      notes: 'Client fidele depuis septembre 2024. Tres satisfait de la solution. Potentiel pour ouvrir un 2eme restaurant en 2025.',
    },
  })

  console.log('Updated client notes')

  console.log('\n--- SEED COMPLETE ---')
  console.log('\nReseller Login (Pro Plan - 20 sites):')
  console.log('  Email: demo@iziresto.com')
  console.log('  Password: Demo1234!')
  console.log('\nReseller Login (Starter Plan - 5 sites):')
  console.log('  Email: test@iziresto.com')
  console.log('  Password: Demo1234!')
  console.log('\nRestaurant Login:')
  console.log('  Email: mario@pizzamario.com')
  console.log('  Password: Demo1234!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
