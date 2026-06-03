export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, products, users } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { toBaseUnit, getPriceInUnit } from '@/lib/units';

// GET /api/orders -> List orders (ADMIN: all, SELLER: own)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, id: userId } = session.user;

    let ordersList;
    if (role === 'ADMIN') {
      // Fetch all orders with seller name and line items
      ordersList = await db.query.orders.findMany({
        orderBy: [desc(orders.createdAt)],
        with: {
          seller: {
            columns: { name: true, email: true },
          },
          items: {
            with: {
              product: {
                columns: { name: true, baseUnit: true },
              },
            },
          },
        },
      });
    } else {
      // Fetch seller's own orders
      ordersList = await db.query.orders.findMany({
        where: eq(orders.sellerId, userId),
        orderBy: [desc(orders.createdAt)],
        with: {
          items: {
            with: {
              product: {
                columns: { name: true, baseUnit: true },
              },
            },
          },
        },
      });
    }

    return NextResponse.json(ordersList);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/orders -> Place order (SELLER only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'SELLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, notes } = body as {
      items: Array<{ productId: string; orderedUnit: string; orderedQuantity: number }>;
      notes?: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    let totalAmountPaise = 0;
    const orderItemsToInsert = [];

    for (const item of items) {
      // Fetch product
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product || !product.isActive) {
        return NextResponse.json({ error: `Product not found or inactive: ID ${item.productId}` }, { status: 404 });
      }

      // Calculate base quantity
      const baseQty = toBaseUnit(item.orderedQuantity, item.orderedUnit);
      const currentStock = parseFloat(product.stockQuantity);

      // Check stock availability
      if (currentStock < baseQty) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}. Requested: ${item.orderedQuantity} ${item.orderedUnit} (${baseQty} ${product.baseUnit}), Available: ${currentStock} ${product.baseUnit}` }, { status: 400 });
      }

      // Calculate unit price per ordered unit
      const basePrice = parseFloat(product.basePrice);
      const unitPrice = getPriceInUnit(basePrice, item.orderedUnit);
      const lineTotal = item.orderedQuantity * unitPrice;

      totalAmountPaise += lineTotal;

      // Deduct stock from product
      const newStock = (currentStock - baseQty).toString();
      await db
        .update(products)
        .set({ stockQuantity: newStock, updatedAt: new Date() })
        .where(eq(products.id, product.id));

      orderItemsToInsert.push({
        productId: product.id,
        orderedUnit: item.orderedUnit,
        orderedQuantity: item.orderedQuantity.toString(),
        baseQuantity: baseQty.toString(),
        unitPrice: unitPrice.toString(),
        lineTotal: lineTotal.toString(),
      });
    }

    // Insert Order
    const [insertedOrder] = await db
      .insert(orders)
      .values({
        sellerId: session.user.id,
        status: 'PENDING',
        totalAmount: totalAmountPaise.toString(),
        notes: notes || null,
      })
      .returning();

    // Insert Order Items
    for (const orderItem of orderItemsToInsert) {
      await db.insert(orderItems).values({
        orderId: insertedOrder.id,
        ...orderItem,
      });
    }

    return NextResponse.json(insertedOrder);
  } catch (error: any) {
    console.error('Error placing order:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
