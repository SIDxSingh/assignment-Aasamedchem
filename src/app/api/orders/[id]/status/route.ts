export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, products, orderItems } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

// PUT /api/orders/[id]/status -> Update order status (ADMIN only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status } = body as { status: string };

    const validStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // 1. Fetch current order status
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If status hasn't changed, return as is
    if (order.status === status) {
      return NextResponse.json(order);
    }

    // 2. Revert stock if transitioning to REJECTED from any non-REJECTED status
    if (status === 'REJECTED' && order.status !== 'REJECTED') {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      for (const item of items) {
        if (!item.productId) continue;

        // Fetch product
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product) {
          const currentStock = parseFloat(product.stockQuantity);
          const revertQty = parseFloat(item.baseQuantity);
          const newStock = (currentStock + revertQty).toString();

          // Revert stock quantity
          await db
            .update(products)
            .set({ stockQuantity: newStock, updatedAt: new Date() })
            .where(eq(products.id, product.id));
        }
      }
    }

    // 3. Re-deduct stock if transitioning from REJECTED back to active statuses (just in case)
    if (order.status === 'REJECTED' && status !== 'REJECTED') {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      for (const item of items) {
        if (!item.productId) continue;

        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product) {
          const currentStock = parseFloat(product.stockQuantity);
          const deductQty = parseFloat(item.baseQuantity);
          const newStock = (currentStock - deductQty).toString();

          if (parseFloat(newStock) < 0) {
            return NextResponse.json({ error: `Cannot transition from REJECTED. Product ${product.name} would have negative stock.` }, { status: 400 });
          }

          await db
            .update(products)
            .set({ stockQuantity: newStock, updatedAt: new Date() })
            .where(eq(products.id, product.id));
        }
      }
    }

    // Update Order Status
    const [finalOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    return NextResponse.json(finalOrder);
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
