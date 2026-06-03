import { loadEnvConfig } from '@next/env';
// Load environment variables before importing db client
loadEnvConfig(process.cwd());

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  const client = neon(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  // 1. Recreate tables (DROP then CREATE)
  console.log('Dropping existing tables if any...');
  await db.execute(sql`DROP TABLE IF EXISTS order_items CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS orders CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS products CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);

  console.log('Creating tables...');
  await db.execute(sql`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SELLER')),
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      sku TEXT UNIQUE,
      description TEXT,
      category TEXT,
      base_unit TEXT NOT NULL,
      base_price NUMERIC(20,6) NOT NULL,
      stock_quantity NUMERIC(20,6) NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_id UUID REFERENCES users(id),
      status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONFIRMED','REJECTED','FULFILLED')),
      total_amount NUMERIC(20,6),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id),
      ordered_unit TEXT NOT NULL,
      ordered_quantity NUMERIC(20,6) NOT NULL,
      base_quantity NUMERIC(20,6) NOT NULL,
      unit_price NUMERIC(20,6) NOT NULL,
      line_total NUMERIC(20,6) NOT NULL
    )
  `);

  // 2. Insert Users
  console.log('Inserting seed users...');
  const adminPasswordHash = await bcrypt.hash('Sid@2003', 10);
  const sellerPasswordHash = await bcrypt.hash('Sid@2003', 10);

  const [adminUser] = await db
    .insert(schema.users)
    .values({
      name: 'Admin User',
      email: 'siddharthwizard123@gmail.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    })
    .returning();

  const [sellerUser] = await db
    .insert(schema.users)
    .values({
      name: 'Seller User',
      email: 'sidsez@gmail.com',
      passwordHash: sellerPasswordHash,
      role: 'SELLER',
    })
    .returning();

  console.log(`Inserted users: admin ID (${adminUser.id}), seller ID (${sellerUser.id})`);

  // 3. Insert Products (at least 8 products across Weight, Volume, Count)
  console.log('Inserting seed products...');
  
  // Weight-based (base: g)
  const [nacl] = await db.insert(schema.products).values({
    name: 'Sodium Chloride (Fine Grade)',
    sku: 'CHEM-NaCl-001',
    description: 'Analytical reagent grade sodium chloride for lab preparations.',
    category: 'Reagents',
    baseUnit: 'g',
    basePrice: '5.000000', // 5 paise per gram (₹0.05 / g, ₹50.00 / kg)
    stockQuantity: '50000.000000', // 50,000 grams (50 kg)
    isActive: true,
  }).returning();

  const [glucose] = await db.insert(schema.products).values({
    name: 'Glucose Powder (Dextrose)',
    sku: 'CHEM-GLUC-002',
    description: 'High purity glucose powder for cellular culture testing.',
    category: 'Nutrients',
    baseUnit: 'g',
    basePrice: '2.500000', // 2.5 paise per gram (₹0.025 / g, ₹25.00 / kg)
    stockQuantity: '120000.000000', // 120,000 grams (120 kg)
    isActive: true,
  }).returning();

  const [citric] = await db.insert(schema.products).values({
    name: 'Citric Acid Anhydrous',
    sku: 'CHEM-CITR-003',
    description: 'Acid regulator powder for buffer preparation.',
    category: 'Reagents',
    baseUnit: 'g',
    basePrice: '4.000000', // 4 paise per gram (₹0.04 / g, ₹40.00 / kg)
    stockQuantity: '30000.000000', // 30,000 grams
    isActive: true,
  }).returning();

  // Volume-based (base: mL)
  const [ethanol] = await db.insert(schema.products).values({
    name: 'Ethanol Absolute (99.9%)',
    sku: 'CHEM-EtOH-004',
    description: 'Anhydrous ethanol solvent for HPLC and chemical synthesis.',
    category: 'Solvents',
    baseUnit: 'mL',
    basePrice: '15.000000', // 15 paise per mL (₹0.15 / mL, ₹150.00 / L)
    stockQuantity: '25000.000000', // 25,000 mL (25 L)
    isActive: true,
  }).returning();

  const [hcl] = await db.insert(schema.products).values({
    name: 'Hydrochloric Acid Solution (1M)',
    sku: 'CHEM-HCl-005',
    description: 'Standardized molar acid solution for titrations.',
    category: 'Acids',
    baseUnit: 'mL',
    basePrice: '12.000000', // 12 paise per mL (₹0.12 / mL, ₹120.00 / L)
    stockQuantity: '10000.000000', // 10,000 mL (10 L)
    isActive: true,
  }).returning();

  const [water] = await db.insert(schema.products).values({
    name: 'Deionized Purified Water',
    sku: 'CHEM-H2O-006',
    description: 'Deionized, ultra-purified water for solution dilution.',
    category: 'Solvents',
    baseUnit: 'mL',
    basePrice: '1.000000', // 1 paise per mL (₹0.01 / mL, ₹10.00 / L)
    stockQuantity: '500000.000000', // 500,000 mL (500 L)
    isActive: true,
  }).returning();

  // Count-based (base: unit)
  const [testtubes] = await db.insert(schema.products).values({
    name: 'Borosilicate Test Tubes (15ml)',
    sku: 'EQ-TTUBE-007',
    description: 'Heat-resistant borosilicate glass test tubes, pack of 50.',
    category: 'Labware',
    baseUnit: 'unit',
    basePrice: '1500.000000', // 1500 paise per pack (₹15.00 / unit)
    stockQuantity: '300.000000', // 300 packs
    isActive: true,
  }).returning();

  const [petridishes] = await db.insert(schema.products).values({
    name: 'Sterile Plastic Petri Dishes (90mm)',
    sku: 'EQ-PETRI-008',
    description: 'Standard single-use plastic dishes for bacterial culture, pack of 20.',
    category: 'Labware',
    baseUnit: 'unit',
    basePrice: '2500.000000', // 2500 paise per pack (₹25.00 / unit)
    stockQuantity: '150.000000', // 150 packs
    isActive: true,
  }).returning();

  console.log('Products inserted.');

  // 4. Insert Sample Orders
  console.log('Inserting sample orders...');

  // Order 1: Pending Order with Weight (kg) and Count conversions
  // Seller orders 2.5 kg NaCl (base: g, factor: 1000) and 10 packs Test Tubes (base: unit, factor: 1)
  const naclOrderedQty = 2.5; // kg
  const naclBaseQty = naclOrderedQty * 1000; // 2500 g
  const naclUnitPrice = parseFloat(nacl.basePrice) * 1000; // 5 * 1000 = 5000 paise per kg (₹50)
  const naclLineTotal = naclOrderedQty * naclUnitPrice; // 12500 paise (₹125)

  const ttOrderedQty = 10; // units
  const ttBaseQty = ttOrderedQty * 1; // 10 units
  const ttUnitPrice = parseFloat(testtubes.basePrice) * 1; // 1500 paise per unit
  const ttLineTotal = ttOrderedQty * ttUnitPrice; // 15000 paise (₹150)

  const order1Total = naclLineTotal + ttLineTotal; // 27500 paise (₹275)

  const [order1] = await db
    .insert(schema.orders)
    .values({
      sellerId: sellerUser.id,
      status: 'PENDING',
      totalAmount: order1Total.toString(),
      notes: 'Initial requisition order for laboratory preparations. Please verify NaCl weight conversion.',
    })
    .returning();

  await db.insert(schema.orderItems).values([
    {
      orderId: order1.id,
      productId: nacl.id,
      orderedUnit: 'kg',
      orderedQuantity: naclOrderedQty.toString(),
      baseQuantity: naclBaseQty.toString(),
      unitPrice: naclUnitPrice.toString(),
      lineTotal: naclLineTotal.toString(),
    },
    {
      orderId: order1.id,
      productId: testtubes.id,
      orderedUnit: 'unit',
      orderedQuantity: ttOrderedQty.toString(),
      baseQuantity: ttBaseQty.toString(),
      unitPrice: ttUnitPrice.toString(),
      lineTotal: ttLineTotal.toString(),
    },
  ]);

  // Order 2: Confirmed Order with Volume (L) and Count conversions
  // Seller orders 5 L Ethanol (base: mL, factor: 1000) and 5 packs Petri Dishes (base: unit, factor: 1)
  const etOrderedQty = 5; // L
  const etBaseQty = etOrderedQty * 1000; // 5000 mL
  const etUnitPrice = parseFloat(ethanol.basePrice) * 1000; // 15 * 1000 = 15000 paise per L (₹150)
  const etLineTotal = etOrderedQty * etUnitPrice; // 75000 paise (₹750)

  const petriOrderedQty = 5; // units
  const petriBaseQty = petriOrderedQty * 1; // 5 units
  const petriUnitPrice = parseFloat(petridishes.basePrice) * 1; // 2500 paise per unit
  const petriLineTotal = petriOrderedQty * petriUnitPrice; // 12500 paise (₹125)

  const order2Total = etLineTotal + petriLineTotal; // 87500 paise (₹875)

  const [order2] = await db
    .insert(schema.orders)
    .values({
      sellerId: sellerUser.id,
      status: 'CONFIRMED',
      totalAmount: order2Total.toString(),
      notes: 'Monthly solvent replenishment and cell culture labware.',
    })
    .returning();

  await db.insert(schema.orderItems).values([
    {
      orderId: order2.id,
      productId: ethanol.id,
      orderedUnit: 'L',
      orderedQuantity: etOrderedQty.toString(),
      baseQuantity: etBaseQty.toString(),
      unitPrice: etUnitPrice.toString(),
      lineTotal: etLineTotal.toString(),
    },
    {
      orderId: order2.id,
      productId: petridishes.id,
      orderedUnit: 'unit',
      orderedQuantity: petriOrderedQty.toString(),
      baseQuantity: petriBaseQty.toString(),
      unitPrice: petriUnitPrice.toString(),
      lineTotal: petriLineTotal.toString(),
    },
  ]);

  // Adjust stock levels for seeded order 1 & 2 because they are pending/confirmed and stock is already deducted at checkout.
  // NaCl: deduct 2500 g -> remaining 47500 g
  await db
    .update(schema.products)
    .set({ stockQuantity: '47500.000000' })
    .where(eq(schema.products.id, nacl.id));

  // Test tubes: deduct 10 -> remaining 290
  await db
    .update(schema.products)
    .set({ stockQuantity: '290.000000' })
    .where(eq(schema.products.id, testtubes.id));

  // Ethanol: deduct 5000 mL -> remaining 20000 mL
  await db
    .update(schema.products)
    .set({ stockQuantity: '20000.000000' })
    .where(eq(schema.products.id, ethanol.id));

  // Petri dishes: deduct 5 -> remaining 145
  await db
    .update(schema.products)
    .set({ stockQuantity: '145.000000' })
    .where(eq(schema.products.id, petridishes.id));

  console.log('Seeded orders created and product stocks updated.');
  console.log('Seeding completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });
