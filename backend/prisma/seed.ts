import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Stable seed IDs — fixed strings ensure upsert is idempotent across runs.
const FARMER_1_ID = 'seed_user_jean_claude'
const FARMER_2_ID = 'seed_user_alice_uwase'

const EQUIPMENT_IDS = [
  'seed_eq_hand_tractor',
  'seed_eq_walking_tractor',
  'seed_eq_maize_sheller',
  'seed_eq_water_pump',
  'seed_eq_knapsack_sprayer',
  'seed_eq_seed_planter',
  'seed_eq_grain_thresher',
  'seed_eq_power_tiller',
  'seed_eq_irrigation_sprinkler',
  'seed_eq_maize_milling_machine',
]

async function main() {
  console.log('🌱 Seeding AgriRent database...\n')

  // ── 1. Hash a development-only password ─────────────────────────────────────
  // This is a placeholder hash for seed/dev use only. Never use in production.
  const devPasswordHash = await bcrypt.hash('Dev@Seed2024!', 10)

  // ── 2. Upsert farmers ────────────────────────────────────────────────────────
  // NOTE: Equipment.ownerId is a FK to User with no DB-level role restriction.
  // The API layer enforces EQUIPMENT_OWNER role, but the seed writes directly
  // via Prisma, bypassing that check. These farmers act as equipment owners
  // for demo purposes only. Once authentication is implemented, equipment
  // should be owned by users with role=EQUIPMENT_OWNER.
  const farmer1 = await prisma.user.upsert({
    where:  { id: FARMER_1_ID },
    update: {},
    create: {
      id:           FARMER_1_ID,
      name:         'Jean Claude',
      email:        'jean.claude@example.com',
      passwordHash: devPasswordHash,
      role:         'FARMER',
    },
  })
  console.log(`✓ Farmer 1: ${farmer1.name} (${farmer1.email})`)

  const farmer2 = await prisma.user.upsert({
    where:  { id: FARMER_2_ID },
    update: {},
    create: {
      id:           FARMER_2_ID,
      name:         'Alice Uwase',
      email:        'alice.uwase@example.com',
      passwordHash: devPasswordHash,
      role:         'FARMER',
    },
  })
  console.log(`✓ Farmer 2: ${farmer2.name} (${farmer2.email})\n`)

  // ── 3. Equipment records ─────────────────────────────────────────────────────
  // approvalStatus = APPROVED so records appear on the public listing page.
  // status = AVAILABLE (operational).
  // Owners alternate between the two farmers for variety.
  const equipmentData = [
    {
      id:          EQUIPMENT_IDS[0]!,
      name:        'Hand Tractor',
      description: 'A compact hand-guided tractor suitable for small to medium plots. Ideal for land preparation, ploughing, and harrowing in hilly Rwandan terrain.',
      category:    'Land Preparation',
      dailyPrice:  25000,
      district:    'Gasabo',
      sector:      'Bumbogo',
      ownerId:     farmer1.id,
    },
    {
      id:          EQUIPMENT_IDS[1]!,
      name:        'Walking Tractor',
      description: 'A two-wheel walking tractor with multiple attachments for tillage and transport. Fuel-efficient and easy to operate on small farms.',
      category:    'Land Preparation',
      dailyPrice:  20000,
      district:    'Rulindo',
      sector:      'Bushoki',
      ownerId:     farmer2.id,
    },
    {
      id:          EQUIPMENT_IDS[2]!,
      name:        'Maize Sheller',
      description: 'A motorised maize sheller that separates kernels from cobs quickly and cleanly. Reduces post-harvest labour significantly.',
      category:    'Post-Harvest',
      dailyPrice:  12000,
      district:    'Gicumbi',
      sector:      'Byumba',
      ownerId:     farmer1.id,
    },
    {
      id:          EQUIPMENT_IDS[3]!,
      name:        'Water Pump',
      description: 'A petrol-powered centrifugal water pump for irrigation and drainage. Suitable for drawing water from rivers, lakes, and boreholes.',
      category:    'Irrigation',
      dailyPrice:  8000,
      district:    'Bugesera',
      sector:      'Nyamata',
      ownerId:     farmer2.id,
    },
    {
      id:          EQUIPMENT_IDS[4]!,
      name:        'Knapsack Sprayer',
      description: 'A 16-litre manual knapsack sprayer for applying pesticides, herbicides, and foliar fertilisers. Lightweight and easy to carry.',
      category:    'Crop Protection',
      dailyPrice:  3000,
      district:    'Rwamagana',
      sector:      'Kigabiro',
      ownerId:     farmer1.id,
    },
    {
      id:          EQUIPMENT_IDS[5]!,
      name:        'Seed Planter',
      description: 'A hand-pushed seed planter for maize, beans, and sorghum. Ensures consistent seed spacing and depth for improved germination rates.',
      category:    'Planting',
      dailyPrice:  10000,
      district:    'Musanze',
      sector:      'Muhoza',
      ownerId:     farmer2.id,
    },
    {
      id:          EQUIPMENT_IDS[6]!,
      name:        'Grain Thresher',
      description: 'A motorised multi-crop thresher for wheat, sorghum, and beans. Significantly reduces threshing time compared to manual methods.',
      category:    'Post-Harvest',
      dailyPrice:  15000,
      district:    'Nyagatare',
      sector:      'Nyagatare',
      ownerId:     farmer1.id,
    },
    {
      id:          EQUIPMENT_IDS[7]!,
      name:        'Power Tiller',
      description: 'A heavy-duty power tiller for deep soil cultivation. Suitable for breaking hard soils and preparing seedbeds on larger plots.',
      category:    'Land Preparation',
      dailyPrice:  18000,
      district:    'Huye',
      sector:      'Ngoma',
      ownerId:     farmer2.id,
    },
    {
      id:          EQUIPMENT_IDS[8]!,
      name:        'Irrigation Sprinkler Set',
      description: 'A complete overhead sprinkler irrigation kit including pipes, risers, and nozzles. Covers up to 0.5 hectares per setup.',
      category:    'Irrigation',
      dailyPrice:  5000,
      district:    'Kirehe',
      sector:      'Kirehe',
      ownerId:     farmer1.id,
    },
    {
      id:          EQUIPMENT_IDS[9]!,
      name:        'Maize Milling Machine',
      description: 'A diesel-powered maize flour milling machine producing fine and coarse flour. Suitable for on-farm processing and small cooperatives.',
      category:    'Processing',
      dailyPrice:  30000,
      district:    'Kayonza',
      sector:      'Mukarange',
      ownerId:     farmer2.id,
    },
  ]

  for (const eq of equipmentData) {
    const record = await prisma.equipment.upsert({
      where:  { id: eq.id },
      update: {},
      create: {
        id:             eq.id,
        name:           eq.name,
        description:    eq.description,
        category:       eq.category,
        dailyPrice:     eq.dailyPrice,
        status:         'AVAILABLE',
        approvalStatus: 'APPROVED',
        imageUrl:       null,
        district:       eq.district,
        sector:         eq.sector,
        ownerId:        eq.ownerId,
      },
    })
    console.log(`✓ Equipment: ${record.name} — ${record.district}, ${record.sector} (${record.approvalStatus})`)
  }

  console.log('\n✅ Seeding complete.')
}

main()
  .catch(err => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
