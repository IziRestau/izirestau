import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedInventory() {
  console.log('=== Seeding inventory data for demo-restaurant ===\n')

  const restaurantId = 'demo-restaurant'

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  })

  if (!restaurant) {
    console.error('Restaurant demo-restaurant not found!')
    return
  }

  console.log(`Found restaurant: ${restaurant.name}\n`)

  // 1. INGREDIENTS
  console.log('1. Creating ingredients...')
  const ingredientsData = [
    // Base pizza
    { name: 'Pâte à pizza', category: 'Base', unit: 'GRAM', currentStock: 10000, reorderPoint: 2000, costPerUnit: 0.002 },
    { name: 'Sauce tomate', category: 'Sauces', unit: 'GRAM', currentStock: 5000, reorderPoint: 1000, costPerUnit: 0.003 },
    { name: 'Mozzarella', category: 'Fromages', unit: 'GRAM', currentStock: 3000, reorderPoint: 500, costPerUnit: 0.012 },
    { name: 'Basilic frais', category: 'Herbes', unit: 'GRAM', currentStock: 200, reorderPoint: 50, costPerUnit: 0.05 },
    { name: 'Huile d\'olive', category: 'Huiles', unit: 'MILLILITER', currentStock: 2000, reorderPoint: 500, costPerUnit: 0.008 },
    // Garnitures pizza
    { name: 'Jambon', category: 'Charcuterie', unit: 'GRAM', currentStock: 2000, reorderPoint: 400, costPerUnit: 0.015 },
    { name: 'Champignons', category: 'Légumes', unit: 'GRAM', currentStock: 1500, reorderPoint: 300, costPerUnit: 0.006 },
    { name: 'Gorgonzola', category: 'Fromages', unit: 'GRAM', currentStock: 800, reorderPoint: 200, costPerUnit: 0.02 },
    { name: 'Chèvre', category: 'Fromages', unit: 'GRAM', currentStock: 600, reorderPoint: 150, costPerUnit: 0.018 },
    { name: 'Parmesan', category: 'Fromages', unit: 'GRAM', currentStock: 500, reorderPoint: 100, costPerUnit: 0.025 },
    { name: 'Salami piquant', category: 'Charcuterie', unit: 'GRAM', currentStock: 1000, reorderPoint: 200, costPerUnit: 0.018 },
    { name: 'Oeuf', category: 'Oeufs', unit: 'UNIT', currentStock: 100, reorderPoint: 20, costPerUnit: 0.25 },
    // Pâtes
    { name: 'Spaghetti', category: 'Pâtes', unit: 'GRAM', currentStock: 5000, reorderPoint: 1000, costPerUnit: 0.003 },
    { name: 'Penne', category: 'Pâtes', unit: 'GRAM', currentStock: 4000, reorderPoint: 800, costPerUnit: 0.003 },
    { name: 'Tagliatelles', category: 'Pâtes', unit: 'GRAM', currentStock: 3000, reorderPoint: 600, costPerUnit: 0.004 },
    { name: 'Lasagnes (feuilles)', category: 'Pâtes', unit: 'UNIT', currentStock: 200, reorderPoint: 50, costPerUnit: 0.15 },
    { name: 'Lardons', category: 'Charcuterie', unit: 'GRAM', currentStock: 2000, reorderPoint: 400, costPerUnit: 0.012 },
    { name: 'Crème fraîche', category: 'Produits laitiers', unit: 'MILLILITER', currentStock: 3000, reorderPoint: 500, costPerUnit: 0.004 },
    { name: 'Ail', category: 'Légumes', unit: 'GRAM', currentStock: 500, reorderPoint: 100, costPerUnit: 0.008 },
    { name: 'Piment', category: 'Épices', unit: 'GRAM', currentStock: 200, reorderPoint: 50, costPerUnit: 0.03 },
    { name: 'Viande hachée boeuf', category: 'Viandes', unit: 'GRAM', currentStock: 3000, reorderPoint: 500, costPerUnit: 0.012 },
    { name: 'Béchamel', category: 'Sauces', unit: 'MILLILITER', currentStock: 2000, reorderPoint: 400, costPerUnit: 0.005 },
    { name: 'Saumon fumé', category: 'Poissons', unit: 'GRAM', currentStock: 1000, reorderPoint: 200, costPerUnit: 0.035 },
    { name: 'Aneth', category: 'Herbes', unit: 'GRAM', currentStock: 100, reorderPoint: 30, costPerUnit: 0.06 },
    // Entrées
    { name: 'Pain ciabatta', category: 'Pains', unit: 'UNIT', currentStock: 50, reorderPoint: 15, costPerUnit: 0.8 },
    { name: 'Tomates fraîches', category: 'Légumes', unit: 'GRAM', currentStock: 3000, reorderPoint: 500, costPerUnit: 0.004 },
    { name: 'Mozzarella di bufala', category: 'Fromages', unit: 'GRAM', currentStock: 1000, reorderPoint: 200, costPerUnit: 0.025 },
    { name: 'Charcuterie italienne (assortiment)', category: 'Charcuterie', unit: 'GRAM', currentStock: 1500, reorderPoint: 300, costPerUnit: 0.022 },
    // Desserts
    { name: 'Mascarpone', category: 'Fromages', unit: 'GRAM', currentStock: 1000, reorderPoint: 200, costPerUnit: 0.015 },
    { name: 'Café expresso (préparé)', category: 'Boissons', unit: 'MILLILITER', currentStock: 2000, reorderPoint: 500, costPerUnit: 0.01 },
    { name: 'Cacao en poudre', category: 'Épices', unit: 'GRAM', currentStock: 500, reorderPoint: 100, costPerUnit: 0.02 },
    { name: 'Biscuits cuillère', category: 'Pâtisserie', unit: 'UNIT', currentStock: 200, reorderPoint: 50, costPerUnit: 0.1 },
    { name: 'Crème liquide', category: 'Produits laitiers', unit: 'MILLILITER', currentStock: 2000, reorderPoint: 400, costPerUnit: 0.003 },
    { name: 'Vanille', category: 'Épices', unit: 'GRAM', currentStock: 50, reorderPoint: 15, costPerUnit: 0.5 },
    { name: 'Coulis fruits rouges', category: 'Sauces', unit: 'MILLILITER', currentStock: 1000, reorderPoint: 200, costPerUnit: 0.008 },
    { name: 'Glace (assortiment)', category: 'Desserts', unit: 'GRAM', currentStock: 5000, reorderPoint: 1000, costPerUnit: 0.01 },
  ]

  const createdIngredients: Record<string, string> = {}
  for (const ing of ingredientsData) {
    const existing = await prisma.ingredient.findFirst({
      where: { restaurantId, name: ing.name },
    })
    if (!existing) {
      const created = await prisma.ingredient.create({
        data: {
          restaurantId,
          name: ing.name,
          category: ing.category,
          unit: ing.unit as any,
          currentStock: ing.currentStock,
          reorderPoint: ing.reorderPoint,
          unitCost: ing.costPerUnit,
          isTracked: true,
        },
      })
      createdIngredients[ing.name] = created.id
    } else {
      createdIngredients[ing.name] = existing.id
    }
  }
  console.log(`  Created/found ${Object.keys(createdIngredients).length} ingredients\n`)

  // 2. RECIPES
  console.log('2. Creating recipes...')
  const recipesData = [
    {
      name: 'Recette Pizza Margherita',
      description: 'Pizza classique italienne',
      yieldQuantity: 1,
      yieldUnit: 'pizza',
      prepTime: 10,
      cookTime: 12,
      ingredients: [
        { name: 'Pâte à pizza', quantity: 250, unit: 'GRAM' },
        { name: 'Sauce tomate', quantity: 80, unit: 'GRAM' },
        { name: 'Mozzarella', quantity: 150, unit: 'GRAM' },
        { name: 'Basilic frais', quantity: 5, unit: 'GRAM' },
        { name: 'Huile d\'olive', quantity: 10, unit: 'MILLILITER' },
      ],
    },
    {
      name: 'Recette Pizza Regina',
      description: 'Pizza jambon champignons',
      yieldQuantity: 1,
      yieldUnit: 'pizza',
      prepTime: 12,
      cookTime: 12,
      ingredients: [
        { name: 'Pâte à pizza', quantity: 250, unit: 'GRAM' },
        { name: 'Sauce tomate', quantity: 80, unit: 'GRAM' },
        { name: 'Mozzarella', quantity: 120, unit: 'GRAM' },
        { name: 'Jambon', quantity: 80, unit: 'GRAM' },
        { name: 'Champignons', quantity: 60, unit: 'GRAM' },
      ],
    },
    {
      name: 'Recette Pizza Quatre Fromages',
      description: 'Pizza aux 4 fromages',
      yieldQuantity: 1,
      yieldUnit: 'pizza',
      prepTime: 10,
      cookTime: 12,
      ingredients: [
        { name: 'Pâte à pizza', quantity: 250, unit: 'GRAM' },
        { name: 'Sauce tomate', quantity: 60, unit: 'GRAM' },
        { name: 'Mozzarella', quantity: 80, unit: 'GRAM' },
        { name: 'Gorgonzola', quantity: 50, unit: 'GRAM' },
        { name: 'Chèvre', quantity: 50, unit: 'GRAM' },
        { name: 'Parmesan', quantity: 30, unit: 'GRAM' },
      ],
    },
    {
      name: 'Recette Pizza Calzone',
      description: 'Pizza pliée garnie',
      yieldQuantity: 1,
      yieldUnit: 'pizza',
      prepTime: 15,
      cookTime: 15,
      ingredients: [
        { name: 'Pâte à pizza', quantity: 300, unit: 'GRAM' },
        { name: 'Sauce tomate', quantity: 60, unit: 'GRAM' },
        { name: 'Mozzarella', quantity: 100, unit: 'GRAM' },
        { name: 'Jambon', quantity: 80, unit: 'GRAM' },
        { name: 'Oeuf', quantity: 1, unit: 'UNIT' },
      ],
    },
    {
      name: 'Recette Pizza Diavola',
      description: 'Pizza piquante au salami',
      yieldQuantity: 1,
      yieldUnit: 'pizza',
      prepTime: 10,
      cookTime: 12,
      ingredients: [
        { name: 'Pâte à pizza', quantity: 250, unit: 'GRAM' },
        { name: 'Sauce tomate', quantity: 80, unit: 'GRAM' },
        { name: 'Mozzarella', quantity: 120, unit: 'GRAM' },
        { name: 'Salami piquant', quantity: 70, unit: 'GRAM' },
        { name: 'Piment', quantity: 2, unit: 'GRAM' },
      ],
    },
    {
      name: 'Recette Spaghetti Carbonara',
      description: 'Pâtes à la carbonara',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 10,
      cookTime: 15,
      ingredients: [
        { name: 'Spaghetti', quantity: 150, unit: 'GRAM' },
        { name: 'Lardons', quantity: 80, unit: 'GRAM' },
        { name: 'Oeuf', quantity: 2, unit: 'UNIT' },
        { name: 'Parmesan', quantity: 40, unit: 'GRAM' },
        { name: 'Crème fraîche', quantity: 30, unit: 'MILLILITER' },
      ],
    },
    {
      name: 'Recette Penne Arrabiata',
      description: 'Pâtes sauce tomate piquante',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 8,
      cookTime: 12,
      ingredients: [
        { name: 'Penne', quantity: 150, unit: 'GRAM' },
        { name: 'Sauce tomate', quantity: 120, unit: 'GRAM' },
        { name: 'Ail', quantity: 10, unit: 'GRAM' },
        { name: 'Piment', quantity: 3, unit: 'GRAM' },
        { name: 'Huile d\'olive', quantity: 15, unit: 'MILLILITER' },
      ],
    },
    {
      name: 'Recette Lasagnes Bolognaise',
      description: 'Lasagnes traditionnelles',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 20,
      cookTime: 45,
      ingredients: [
        { name: 'Lasagnes (feuilles)', quantity: 4, unit: 'UNIT' },
        { name: 'Viande hachée boeuf', quantity: 150, unit: 'GRAM' },
        { name: 'Sauce tomate', quantity: 100, unit: 'GRAM' },
        { name: 'Béchamel', quantity: 100, unit: 'MILLILITER' },
        { name: 'Parmesan', quantity: 30, unit: 'GRAM' },
      ],
    },
    {
      name: 'Recette Tagliatelles Saumon',
      description: 'Pâtes au saumon fumé',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 10,
      cookTime: 12,
      ingredients: [
        { name: 'Tagliatelles', quantity: 150, unit: 'GRAM' },
        { name: 'Saumon fumé', quantity: 80, unit: 'GRAM' },
        { name: 'Crème fraîche', quantity: 100, unit: 'MILLILITER' },
        { name: 'Aneth', quantity: 3, unit: 'GRAM' },
      ],
    },
    {
      name: 'Recette Bruschetta',
      description: 'Tartine italienne',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 8,
      cookTime: 5,
      ingredients: [
        { name: 'Pain ciabatta', quantity: 1, unit: 'UNIT' },
        { name: 'Tomates fraîches', quantity: 100, unit: 'GRAM' },
        { name: 'Basilic frais', quantity: 5, unit: 'GRAM' },
        { name: 'Huile d\'olive', quantity: 15, unit: 'MILLILITER' },
        { name: 'Ail', quantity: 5, unit: 'GRAM' },
      ],
    },
    {
      name: 'Recette Caprese',
      description: 'Salade tomate mozzarella',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 5,
      cookTime: 0,
      ingredients: [
        { name: 'Mozzarella di bufala', quantity: 125, unit: 'GRAM' },
        { name: 'Tomates fraîches', quantity: 150, unit: 'GRAM' },
        { name: 'Basilic frais', quantity: 8, unit: 'GRAM' },
        { name: 'Huile d\'olive', quantity: 20, unit: 'MILLILITER' },
      ],
    },
    {
      name: 'Recette Antipasti',
      description: 'Assortiment charcuterie',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 5,
      cookTime: 0,
      ingredients: [
        { name: 'Charcuterie italienne (assortiment)', quantity: 150, unit: 'GRAM' },
        { name: 'Huile d\'olive', quantity: 10, unit: 'MILLILITER' },
      ],
    },
    {
      name: 'Recette Tiramisu',
      description: 'Dessert italien au café',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 20,
      cookTime: 0,
      ingredients: [
        { name: 'Mascarpone', quantity: 100, unit: 'GRAM' },
        { name: 'Café expresso (préparé)', quantity: 50, unit: 'MILLILITER' },
        { name: 'Cacao en poudre', quantity: 5, unit: 'GRAM' },
        { name: 'Biscuits cuillère', quantity: 6, unit: 'UNIT' },
        { name: 'Oeuf', quantity: 1, unit: 'UNIT' },
      ],
    },
    {
      name: 'Recette Panna Cotta',
      description: 'Crème cuite italienne',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 10,
      cookTime: 5,
      ingredients: [
        { name: 'Crème liquide', quantity: 150, unit: 'MILLILITER' },
        { name: 'Vanille', quantity: 1, unit: 'GRAM' },
        { name: 'Coulis fruits rouges', quantity: 30, unit: 'MILLILITER' },
      ],
    },
    {
      name: 'Recette Gelato',
      description: 'Glace italienne',
      yieldQuantity: 1,
      yieldUnit: 'portion',
      prepTime: 2,
      cookTime: 0,
      ingredients: [
        { name: 'Glace (assortiment)', quantity: 150, unit: 'GRAM' },
      ],
    },
  ]

  const createdRecipes: Record<string, string> = {}
  for (const recipe of recipesData) {
    const existing = await prisma.recipe.findFirst({
      where: { restaurantId, name: recipe.name },
    })
    
    if (!existing) {
      const created = await prisma.recipe.create({
        data: {
          restaurantId,
          name: recipe.name,
          description: recipe.description,
          yieldQuantity: recipe.yieldQuantity,
          yieldUnit: recipe.yieldUnit,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          isActive: true,
          ingredients: {
            create: recipe.ingredients.map(ing => ({
              ingredientId: createdIngredients[ing.name],
              quantity: ing.quantity,
              unit: ing.unit,
            })),
          },
        },
      })
      createdRecipes[recipe.name] = created.id

      // Calculer le coût de la recette
      let totalCost = 0
      for (const ing of recipe.ingredients) {
        const ingredient = ingredientsData.find(i => i.name === ing.name)
        if (ingredient) {
          totalCost += ing.quantity * ingredient.costPerUnit
        }
      }
      await prisma.recipe.update({
        where: { id: created.id },
        data: {
          totalCost,
          costPerUnit: totalCost / recipe.yieldQuantity,
        },
      })
    } else {
      createdRecipes[recipe.name] = existing.id
    }
  }
  console.log(`  Created/found ${Object.keys(createdRecipes).length} recipes\n`)

  // 3. LINK PRODUCTS TO RECIPES
  console.log('3. Linking products to recipes...')
  const productRecipeLinks = [
    { productName: 'Margherita', recipeName: 'Recette Pizza Margherita' },
    { productName: 'Regina', recipeName: 'Recette Pizza Regina' },
    { productName: 'Quatre Fromages', recipeName: 'Recette Pizza Quatre Fromages' },
    { productName: 'Calzone', recipeName: 'Recette Pizza Calzone' },
    { productName: 'Diavola', recipeName: 'Recette Pizza Diavola' },
    { productName: 'Spaghetti Carbonara', recipeName: 'Recette Spaghetti Carbonara' },
    { productName: 'Penne Arrabiata', recipeName: 'Recette Penne Arrabiata' },
    { productName: 'Lasagnes Bolognaise', recipeName: 'Recette Lasagnes Bolognaise' },
    { productName: 'Tagliatelles Saumon', recipeName: 'Recette Tagliatelles Saumon' },
    { productName: 'Bruschetta', recipeName: 'Recette Bruschetta' },
    { productName: 'Caprese', recipeName: 'Recette Caprese' },
    { productName: 'Antipasti', recipeName: 'Recette Antipasti' },
    { productName: 'Tiramisu', recipeName: 'Recette Tiramisu' },
    { productName: 'Panna Cotta', recipeName: 'Recette Panna Cotta' },
    { productName: 'Gelato', recipeName: 'Recette Gelato' },
  ]

  let linkedCount = 0
  for (const link of productRecipeLinks) {
    const product = await prisma.product.findFirst({
      where: { restaurantId, name: link.productName },
    })
    const recipeId = createdRecipes[link.recipeName]

    if (product && recipeId) {
      await prisma.product.update({
        where: { id: product.id },
        data: { recipeId },
      })
      linkedCount++
      console.log(`  Linked: ${link.productName} -> ${link.recipeName}`)
    }
  }
  console.log(`\n  Linked ${linkedCount} products to recipes\n`)

  // 4. CREATE SOME STOCK MOVEMENTS
  console.log('4. Creating initial stock movements...')
  const staffUser = await prisma.restaurantStaff.findFirst({
    where: { restaurantId },
  })

  if (staffUser) {
    for (const [name, ingredientId] of Object.entries(createdIngredients)) {
      const ingredient = ingredientsData.find(i => i.name === name)
      if (ingredient) {
        const existingMovement = await prisma.stockMovement.findFirst({
          where: { ingredientId, type: 'PURCHASE' },
        })
        if (!existingMovement) {
          await prisma.stockMovement.create({
            data: {
              restaurantId,
              ingredientId,
              type: 'PURCHASE',
              quantity: ingredient.currentStock,
              reason: 'Stock initial',
              performedBy: staffUser.userId,
            },
          })
        }
      }
    }
    console.log(`  Created initial stock movements for ${Object.keys(createdIngredients).length} ingredients\n`)
  }

  // Summary
  console.log('=== Inventory Seed completed! ===')
  console.log(`Restaurant: ${restaurant.name}`)
  console.log(`Ingredients: ${Object.keys(createdIngredients).length}`)
  console.log(`Recipes: ${Object.keys(createdRecipes).length}`)
  console.log(`Products linked to recipes: ${linkedCount}`)
  console.log(`\nYou can now test:`)
  console.log(`- Creating orders with products that have recipes`)
  console.log(`- Stock will be automatically deducted`)
  console.log(`- Cancelling orders will restore stock`)
}

seedInventory()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
