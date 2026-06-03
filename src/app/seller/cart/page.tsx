'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatINR } from '@/lib/units';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  baseUnit: string;
  basePrice: string;
  chosenUnit: string;
  quantity: number;
  unitPrice: number; // in paise
  lineTotal: number; // in paise
}

export default function SellerCartPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [notes, setNotes] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);

  // Load cart from localStorage
  React.useEffect(() => {
    try {
      const savedCart = localStorage.getItem('aasa_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      setCartItems([]);
    }
    setInitialized(true);
  }, []);

  const updateQuantity = (itemId: string, qtyStr: string) => {
    const qty = parseFloat(qtyStr);
    if (isNaN(qty) || qty <= 0) return;

    const updated = cartItems.map((item) => {
      if (item.id === itemId) {
        const lineTotal = qty * item.unitPrice;
        return { ...item, quantity: qty, lineTotal };
      }
      return item;
    });

    setCartItems(updated);
    localStorage.setItem('aasa_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (itemId: string) => {
    const filtered = cartItems.filter((item) => item.id !== itemId);
    setCartItems(filtered);
    localStorage.setItem('aasa_cart', JSON.stringify(filtered));
    window.dispatchEvent(new Event('cart-updated'));
    toast({
      title: 'Item Removed',
      description: 'Item was removed from your cart.',
      variant: 'info',
    });
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setSubmitting(true);
    const payload = {
      items: cartItems.map((item) => ({
        productId: item.productId,
        orderedUnit: item.chosenUnit,
        orderedQuantity: item.quantity,
      })),
      notes: notes.trim() || undefined,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to place order.');
      }

      toast({
        title: 'Order Placed Successfully!',
        description: 'Your requisition is now pending admin approval.',
        variant: 'success',
      });

      // Clear Cart
      localStorage.removeItem('aasa_cart');
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/seller/orders');
    } catch (err: any) {
      toast({
        title: 'Checkout Error',
        description: err.message,
        variant: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotal = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);

  if (!initialized) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900 mb-2" />
        <span>Loading cart details...</span>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4">
        <div className="inline-flex p-4 bg-slate-100 rounded-full text-slate-900 mb-4">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your Cart is Empty</h2>
        <p className="text-slate-500 mt-2 mb-6">
          Looks like you haven&apos;t added any items to your cart yet. Browse our catalog to get started.
        </p>
        <Link href="/seller/products">
          <Button id="btn-browse-catalog" className="flex items-center justify-center space-x-2 mx-auto">
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Products</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shopping Cart</h1>
        <p className="text-slate-500 mt-1">Review items, set final quantities, and place your order requisition.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart items list */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Product</th>
                  <th className="py-3 px-6 text-center">Unit</th>
                  <th className="py-3 px-6 text-center">Quantity</th>
                  <th className="py-3 px-6 text-right">Unit Price</th>
                  <th className="py-3 px-6 text-right">Line Total</th>
                  <th className="py-3 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {cartItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900">{item.name}</td>
                    <td className="py-4 px-6 text-center text-slate-600 font-mono text-xs">{item.chosenUnit}</td>
                    <td className="py-4 px-6 text-center">
                      <input
                        id={`cart-qty-${item.id}`}
                        type="number"
                        step="any"
                        min="0.0001"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        className="w-20 mx-auto p-1 border border-slate-200 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                        disabled={submitting}
                      />
                    </td>
                    <td className="py-4 px-6 text-right text-slate-600 font-mono">
                      {formatINR(item.unitPrice)}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-900 font-mono">
                      {formatINR(item.lineTotal)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Button
                        id={`btn-remove-item-${item.id}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50"
                        disabled={submitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Order Summary & Notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Finalize details and submit to warehouse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Items:</span>
                <span className="font-semibold text-slate-900">{cartItems.length}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-base font-bold">
                <span className="text-slate-900">Total Requisition:</span>
                <span className="text-slate-900 font-mono">{formatINR(grandTotal)}</span>
              </div>

              {/* Order Notes */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="text-xs font-semibold text-slate-700 uppercase" htmlFor="cart-notes">
                  Order Notes / Requisition Instructions
                </label>
                <textarea
                  id="cart-notes"
                  placeholder="e.g. Expedited shipping requested for sodium chloride line..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none bg-white"
                  disabled={submitting}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-4">
              <Button
                id="btn-place-order"
                className="w-full flex items-center justify-center space-x-2"
                onClick={handleCheckout}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Place Order</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
