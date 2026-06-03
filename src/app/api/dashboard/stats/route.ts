import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, orders } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, sql, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Total active products count
    const [totalProductsRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.isActive, true));

    // 2. Low stock items (stock <= 10)
    const [lowStockRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          sql`cast(${products.stockQuantity} as numeric) <= 10`
        )
      );

    // 3. Pending orders count
    const [pendingOrdersRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'PENDING'));

    // 4. Total Revenue (sum of totalAmount for CONFIRMED and FULFILLED orders, in paise)
    const [totalRevenueRes] = await db
      .select({ sum: sql<string>`coalesce(sum(cast(${orders.totalAmount} as numeric)), 0)` })
      .from(orders)
      .where(inArray(orders.status, ['CONFIRMED', 'FULFILLED']));

    return NextResponse.json({
      totalProducts: totalProductsRes?.count || 0,
      lowStockItems: lowStockRes?.count || 0,
      pendingOrders: pendingOrdersRes?.count || 0,
      totalRevenue: parseFloat(totalRevenueRes?.sum || '0'),
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
