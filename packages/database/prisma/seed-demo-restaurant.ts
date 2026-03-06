import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDemoRestaurant() {
  console.log('=== Seeding demo-restaurant with complete test data ===\n')

  const restaurantId = 'demo-restaurant'

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  })

  if (!restaurant) {
    console.error('Restaurant demo-restaurant not found!')
    return
  }

  console.log(`Found restaurant: ${restaurant.name}\n`)

  // 1. CATEGORIES
  console.log('1. Creating categories...')
  const categories = [
    { name: 'Pizzas', slug: 'pizzas', description: 'Nos pizzas artisanales', sortOrder: 1 },
    { name: 'Pates', slug: 'pates', description: 'Pates fraiches maison', sortOrder: 2 },
    { name: 'Entrees', slug: 'entrees', description: 'Pour bien commencer', sortOrder: 3 },
    { name: 'Desserts', slug: 'desserts', description: 'Finir en beaute', sortOrder: 4 },
    { name: 'Boissons', slug: 'boissons', description: 'Rafraichissements', sortOrder: 5 },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { restaurantId, name: cat.name },
    })
    if (!existing) {
      const created = await prisma.category.create({
        data: { ...cat, restaurantId },
      })
      createdCategories[cat.name] = created.id
    } else {
      createdCategories[cat.name] = existing.id
    }
  }
  console.log(`  Created/found ${Object.keys(createdCategories).length} categories\n`)

  // 2. PRODUCTS
  console.log('2. Creating products...')
  const products = [
    // Pizzas
    { name: 'Margherita', slug: 'margherita', description: 'Tomate, mozzarella, basilic', price: 12.5, categoryName: 'Pizzas' },
    { name: 'Regina', slug: 'regina', description: 'Tomate, mozzarella, jambon, champignons', price: 14.0, categoryName: 'Pizzas' },
    { name: 'Quatre Fromages', slug: 'quatre-fromages', description: 'Mozzarella, gorgonzola, chevre, parmesan', price: 15.0, categoryName: 'Pizzas' },
    { name: 'Calzone', slug: 'calzone', description: 'Pizza pliee, jambon, oeuf, mozzarella', price: 14.5, categoryName: 'Pizzas' },
    { name: 'Diavola', slug: 'diavola', description: 'Tomate, mozzarella, salami piquant', price: 14.0, categoryName: 'Pizzas' },
    // Pates
    { name: 'Spaghetti Carbonara', slug: 'spaghetti-carbonara', description: 'Lardons, oeuf, parmesan, poivre', price: 13.0, categoryName: 'Pates' },
    { name: 'Penne Arrabiata', slug: 'penne-arrabiata', description: 'Sauce tomate pimentee, ail', price: 11.5, categoryName: 'Pates' },
    { name: 'Lasagnes Bolognaise', slug: 'lasagnes-bolognaise', description: 'Viande hachee, bechamel, parmesan', price: 14.0, categoryName: 'Pates' },
    { name: 'Tagliatelles Saumon', slug: 'tagliatelles-saumon', description: 'Saumon fume, creme, aneth', price: 15.5, categoryName: 'Pates' },
    // Entrees
    { name: 'Bruschetta', slug: 'bruschetta', description: 'Pain grille, tomates, basilic, huile olive', price: 7.0, categoryName: 'Entrees' },
    { name: 'Caprese', slug: 'caprese', description: 'Mozzarella di bufala, tomates, basilic', price: 9.0, categoryName: 'Entrees' },
    { name: 'Antipasti', slug: 'antipasti', description: 'Assortiment de charcuteries italiennes', price: 12.0, categoryName: 'Entrees' },
    // Desserts
    { name: 'Tiramisu', slug: 'tiramisu', description: 'Mascarpone, cafe, cacao', price: 7.0, categoryName: 'Desserts' },
    { name: 'Panna Cotta', slug: 'panna-cotta', description: 'Creme vanillee, coulis fruits rouges', price: 6.5, categoryName: 'Desserts' },
    { name: 'Gelato', slug: 'gelato', description: '3 boules au choix', price: 5.5, categoryName: 'Desserts' },
    // Boissons
    { name: 'Coca-Cola', slug: 'coca-cola', description: '33cl', price: 3.5, categoryName: 'Boissons' },
    { name: 'Eau minerale', slug: 'eau-minerale', description: 'Evian 50cl', price: 3.0, categoryName: 'Boissons' },
    { name: 'Cafe expresso', slug: 'cafe-expresso', description: 'Cafe italien', price: 2.5, categoryName: 'Boissons' },
    { name: 'Limoncello', slug: 'limoncello', description: 'Digestif italien', price: 5.0, categoryName: 'Boissons' },
  ]

  const createdProducts: Array<{ id: string; name: string; price: number }> = []
  for (const prod of products) {
    const existing = await prisma.product.findFirst({
      where: { restaurantId, name: prod.name },
    })
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          restaurantId,
          categoryId: createdCategories[prod.categoryName],
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          price: prod.price,
          isActive: true,
          isVisible: true,
        },
      })
      createdProducts.push({ id: created.id, name: created.name, price: Number(created.price) })
    } else {
      createdProducts.push({ id: existing.id, name: existing.name, price: Number(existing.price) })
    }
  }
  console.log(`  Created/found ${createdProducts.length} products\n`)

  // 3. CUSTOMERS
  console.log('3. Creating customers...')
  const customerData = [
    { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@test.com', phone: '+33612345678' },
    { firstName: 'Pierre', lastName: 'Durand', email: 'pierre.durand@test.com', phone: '+33623456789' },
    { firstName: 'Sophie', lastName: 'Bernard', email: 'sophie.bernard@test.com', phone: '+33634567890' },
    { firstName: 'Lucas', lastName: 'Petit', email: 'lucas.petit@test.com', phone: '+33645678901' },
    { firstName: 'Emma', lastName: 'Robert', email: 'emma.robert@test.com', phone: '+33656789012' },
    { firstName: 'Antoine', lastName: 'Moreau', email: 'antoine.moreau@test.com', phone: '+33667890123' },
    { firstName: 'Camille', lastName: 'Simon', email: 'camille.simon@test.com', phone: '+33678901234' },
    { firstName: 'Hugo', lastName: 'Laurent', email: 'hugo.laurent@test.com', phone: '+33689012345' },
    { firstName: 'Lea', lastName: 'Michel', email: 'lea.michel@test.com', phone: '+33690123456' },
    { firstName: 'Thomas', lastName: 'Garcia', email: 'thomas.garcia@test.com', phone: '+33601234567' },
  ]

  const customers: Array<{ id: string; firstName: string; lastName: string }> = []
  for (const data of customerData) {
    const existing = await prisma.restaurantCustomer.findFirst({
      where: { restaurantId, email: data.email },
    })
    if (!existing) {
      const created = await prisma.restaurantCustomer.create({
        data: { ...data, restaurantId },
      })
      customers.push({ id: created.id, firstName: created.firstName, lastName: created.lastName })
    } else {
      customers.push({ id: existing.id, firstName: existing.firstName, lastName: existing.lastName })
    }
  }
  console.log(`  Created/found ${customers.length} customers\n`)

  // 4. ORDERS
  console.log('4. Creating orders...')
  const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'DELIVERED', 'PICKED_UP', 'CANCELLED'] as const
  const serviceTypes = ['DELIVERY', 'PICKUP', 'DINE_IN'] as const
  const paymentMethods = ['CASH', 'CARD', 'CARD_ONLINE'] as const
  const sources = ['WEBSITE', 'MOBILE_APP', 'POS', 'PHONE'] as const
  const guestNames = ['Jean Dupont', 'Alice Moreau', 'Nicolas Bonnet', 'Julie Girard', 'Marc Lefevre']

  const existingOrdersCount = await prisma.order.count({ where: { restaurantId } })
  
  if (existingOrdersCount < 30) {
    const ordersToCreate = 30 - existingOrdersCount
    
    for (let i = 0; i < ordersToCreate; i++) {
      const useCustomer = Math.random() > 0.25
      const customer = useCustomer ? customers[Math.floor(Math.random() * customers.length)] : null
      const guestName = !useCustomer ? guestNames[Math.floor(Math.random() * guestNames.length)] : null

      const statusIndex = Math.floor(Math.random() * statuses.length)
      const status = statuses[statusIndex]
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)]
      
      let paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED' = 'PENDING'
      if (status === 'CANCELLED') {
        paymentStatus = 'CANCELLED'
      } else if (['COMPLETED', 'DELIVERED', 'PICKED_UP'].includes(status)) {
        paymentStatus = 'PAID'
      } else if (Math.random() > 0.4) {
        paymentStatus = 'PAID'
      }

      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      const source = sources[Math.floor(Math.random() * sources.length)]

      const daysAgo = Math.floor(Math.random() * 45)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)
      createdAt.setHours(Math.floor(Math.random() * 14) + 10)
      createdAt.setMinutes(Math.floor(Math.random() * 60))

      const itemCount = Math.floor(Math.random() * 5) + 1
      let subtotal = 0
      const orderItems: Array<{
        productId: string
        productName: string
        quantity: number
        unitPrice: number
        totalPrice: number
        modifiersTotal: number
      }> = []

      const usedProductIds = new Set<string>()
      for (let j = 0; j < itemCount; j++) {
        const availableProducts = createdProducts.filter(p => !usedProductIds.has(p.id))
        if (availableProducts.length === 0) break
        
        const product = availableProducts[Math.floor(Math.random() * availableProducts.length)]
        usedProductIds.add(product.id)
        
        const quantity = Math.floor(Math.random() * 3) + 1
        const totalPrice = product.price * quantity

        orderItems.push({
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
          totalPrice,
          modifiersTotal: 0,
        })

        subtotal += totalPrice
      }

      const taxRate = 0.1
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100
      const deliveryFee = serviceType === 'DELIVERY' ? 3.5 : 0
      const tip = Math.random() > 0.75 ? Math.floor(Math.random() * 5) + 1 : 0
      const total = Math.round((subtotal + taxAmount + deliveryFee + tip) * 100) / 100

      const orderNumber = `ORD-${Date.now()}-${i}`
      const displayNumber = `${1000 + existingOrdersCount + i}`

      await prisma.order.create({
        data: {
          restaurantId,
          customerId: customer?.id,
          guestName,
          guestEmail: guestName ? `${guestName.toLowerCase().replace(' ', '.')}@guest.com` : null,
          guestPhone: guestName ? `+336${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}` : null,
          orderNumber,
          displayNumber,
          status,
          paymentStatus,
          paymentMethod,
          serviceType,
          source,
          subtotal,
          taxAmount,
          deliveryFee,
          tip,
          discount: 0,
          total,
          deliveryAddress: serviceType === 'DELIVERY' ? {
            street: `${Math.floor(Math.random() * 200) + 1} Rue ${['de la Paix', 'Victor Hugo', 'des Lilas', 'du Commerce', 'Pasteur'][Math.floor(Math.random() * 5)]}`,
            city: 'Paris',
            postalCode: `750${Math.floor(Math.random() * 20).toString().padStart(2, '0')}`,
            country: 'France',
          } : undefined,
          customerNotes: Math.random() > 0.8 ? ['Sans oignons svp', 'Bien cuit', 'Allergie gluten', 'Extra fromage'][Math.floor(Math.random() * 4)] : null,
          cancelReason: status === 'CANCELLED' ? ['Client absent', 'Produit indisponible', 'Erreur de commande'][Math.floor(Math.random() * 3)] : null,
          cancelledAt: status === 'CANCELLED' ? createdAt : null,
          paidAt: paymentStatus === 'PAID' ? createdAt : null,
          createdAt,
          updatedAt: createdAt,
          items: {
            create: orderItems.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              modifiersTotal: item.modifiersTotal,
            })),
          },
          timeline: {
            create: {
              status: 'PENDING',
              message: 'Commande recue',
              createdAt,
            },
          },
        },
      })

      if (customer) {
        await prisma.restaurantCustomer.update({
          where: { id: customer.id },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: total },
            lastOrderAt: createdAt,
          },
        })
      }
    }
    console.log(`  Created ${ordersToCreate} orders\n`)
  } else {
    console.log(`  Already have ${existingOrdersCount} orders, skipping\n`)
  }

  // 5. REVIEWS
  console.log('5. Creating reviews...')
  const existingReviewsCount = await prisma.review.count({ where: { restaurantId } })
  
  if (existingReviewsCount < 15) {
    const reviewsToCreate = 15 - existingReviewsCount
    const reviewTitles = [
      'Excellent!', 'Tres bon', 'Delicieux', 'A recommander', 'Super experience',
      'Correct', 'Moyen', 'Peut mieux faire', 'Decevant', 'Pas terrible'
    ]
    const reviewComments = [
      'Les pizzas sont excellentes, cuisson parfaite!',
      'Service rapide et personnel agreable.',
      'Bonne qualite des produits, je reviendrai.',
      'Livraison un peu longue mais plats encore chauds.',
      'Rapport qualite-prix correct.',
      'Les pates etaient un peu trop cuites.',
      'Tres bonne adresse, je recommande la Margherita.',
      'Ambiance sympa, parfait pour un diner en famille.',
      'Le tiramisu est a tomber!',
      'Commande conforme, rien a redire.',
    ]

    for (let i = 0; i < reviewsToCreate; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)]
      const rating = Math.floor(Math.random() * 3) + 3
      const daysAgo = Math.floor(Math.random() * 60)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)

      await prisma.review.create({
        data: {
          restaurantId,
          customerId: customer.id,
          rating,
          title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
          comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
          isPublished: Math.random() > 0.2,
          response: Math.random() > 0.6 ? 'Merci pour votre avis! A bientot.' : null,
          respondedAt: Math.random() > 0.6 ? createdAt : null,
          createdAt,
        },
      })
    }
    console.log(`  Created ${reviewsToCreate} reviews\n`)
  } else {
    console.log(`  Already have ${existingReviewsCount} reviews, skipping\n`)
  }

  // 6. COUPONS
  console.log('6. Creating coupons...')
  const coupons = [
    { code: 'BIENVENUE10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 20, maxUses: 100, description: 'Bienvenue! -10% sur votre premiere commande' },
    { code: 'PIZZA5', discountType: 'FIXED', discountValue: 5, minOrderAmount: 25, maxUses: 50, description: '5 euros offerts sur les pizzas' },
    { code: 'LIVRAISON', discountType: 'FIXED', discountValue: 3.5, minOrderAmount: 15, maxUses: undefined, description: 'Livraison gratuite' },
  ]

  for (const coupon of coupons) {
    const existing = await prisma.coupon.findFirst({
      where: { restaurantId, code: coupon.code },
    })
    if (!existing) {
      await prisma.coupon.create({
        data: {
          restaurantId,
          code: coupon.code,
          discountType: coupon.discountType as 'PERCENTAGE' | 'FIXED',
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxUses: coupon.maxUses,
          description: coupon.description,
          isActive: true,
        },
      })
    }
  }
  console.log(`  Created/found ${coupons.length} coupons\n`)

  // Summary
  console.log('=== Seed completed! ===')
  console.log(`Restaurant: ${restaurant.name}`)
  console.log(`Categories: ${Object.keys(createdCategories).length}`)
  console.log(`Products: ${createdProducts.length}`)
  console.log(`Customers: ${customers.length}`)
  console.log(`Orders: ${await prisma.order.count({ where: { restaurantId } })}`)
  console.log(`Reviews: ${await prisma.review.count({ where: { restaurantId } })}`)
  console.log(`Coupons: ${await prisma.coupon.count({ where: { restaurantId } })}`)
}

seedDemoRestaurant()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
