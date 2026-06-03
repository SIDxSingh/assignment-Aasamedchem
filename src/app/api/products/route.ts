export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, or, ilike } from 'drizzle-orm';

// GET /api/products -> list active products with search/filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const unitType = searchParams.get('unitType') || ''; // 'g', 'mL', or 'unit'

    const conditions = [eq(products.isActive, true)];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(products.category, category));
    }

    if (unitType) {
      conditions.push(eq(products.baseUnit, unitType));
    }

    const items = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(products.name);

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/products -> create product (ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, sku, description, category, baseUnit, basePrice, stockQuantity } = body;

    if (!name || !baseUnit || basePrice === undefined || stockQuantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // basePrice is passed in ₹, store in paise (multiply by 100)
    const basePriceInPaise = (parseFloat(basePrice) * 100).toString();
    const stockQtyStr = parseFloat(stockQuantity).toString();

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        sku: sku || null,
        description: description || null,
        category: category || null,
        baseUnit,
        basePrice: basePriceInPaise,
        stockQuantity: stockQtyStr,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newProduct);
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
