'use client';

import * as React from 'react';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronDown, ChevronUp, Check, X, CheckSquare, MessageSquare } from 'lucide-react';
import { formatINR } from '@/lib/units';

interface OrderItem {
  id: string;
  productId: string;
  orderedUnit: string;
  orderedQuantity: string;
  baseQuantity: string;
  unitPrice: string; // stored in paise, decimal string
  lineTotal: string; // stored in paise, decimal string
  product: {
    name: string;
    baseUnit: string;
  } | null;
}

interface Order {
  id: string;
  sellerId: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'FULFILLED';
  totalAmount: string; // stored in paise, decimal string
  notes: string | null;
  createdAt: string;
  seller: {
    name: string;
    email: string;
  } | null;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedOrders, setExpandedOrders] = React.useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Could not fetch order requests.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update order status.');
      }

      toast({
        title: 'Status Updated',
        description: `Order successfully changed to ${newStatus}.`,
        variant: 'success',
      });
      fetchOrders();
    } catch (err: any) {
      toast({
        title: 'Error Updating Status',
        description: err.message,
        variant: 'danger',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">PENDING</Badge>;
      case 'CONFIRMED':
        return <Badge variant="info">CONFIRMED</Badge>;
      case 'FULFILLED':
        return <Badge variant="success">FULFILLED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Order Approval Desk</h1>
        <p className="text-slate-500 mt-1">Review seller requisitions, inspect conversion ratios, and update dispatch status.</p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-slate-950 mb-3" />
              <span>Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No orders have been placed yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6 w-10"></th>
                  <th className="py-3 px-6">Order ID</th>
                  <th className="py-3 px-6">Seller Name</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Total Amount</th>
                  <th className="py-3 px-6 text-center">Action Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map((order) => {
                  const isExpanded = !!expandedOrders[order.id];
                  const totalAmt = parseFloat(order.totalAmount || '0');
                  const dateStr = new Date(order.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <React.Fragment key={order.id}>
                      {/* Main Row */}
                      <tr
                        className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-50/30' : ''
                        }`}
                        onClick={() => toggleExpand(order.id)}
                      >
                        <td className="py-4 px-6">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-950">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="py-4 px-6 text-slate-900 font-medium">
                          {order.seller?.name || 'Unknown'}
                        </td>
                        <td className="py-4 px-6 text-slate-500 text-xs">
                          {dateStr}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-slate-900 font-mono">
                          {formatINR(totalAmt)}
                        </td>
                        <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1.5">
                            {order.status === 'PENDING' && (
                              <>
                                <Button
                                  id={`btn-confirm-order-${order.id}`}
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                                  disabled={updatingId === order.id}
                                  className="h-8 px-2.5 text-xs flex items-center space-x-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Confirm</span>
                                </Button>
                                <Button
                                  id={`btn-reject-order-${order.id}`}
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleStatusChange(order.id, 'REJECTED')}
                                  disabled={updatingId === order.id}
                                  className="h-8 px-2.5 text-xs flex items-center space-x-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </Button>
                              </>
                            )}
                            {order.status === 'CONFIRMED' && (
                              <Button
                                id={`btn-fulfill-order-${order.id}`}
                                variant="default"
                                size="sm"
                                onClick={() => handleStatusChange(order.id, 'FULFILLED')}
                                disabled={updatingId === order.id}
                                className="h-8 px-2.5 text-xs flex items-center space-x-1 bg-slate-950 text-white"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Fulfill</span>
                              </Button>
                            )}
                            {(order.status === 'FULFILLED' || order.status === 'REJECTED') && (
                              <span className="text-xs text-slate-400 font-medium">Locked</span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="py-4 px-8 border-t border-slate-100">
                            <div className="space-y-4">
                              {order.notes && (
                                <div className="flex items-start space-x-2 text-xs bg-amber-50 text-amber-900 p-3 rounded-md border border-amber-200">
                                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="font-semibold">Seller Requisition Note: </span>
                                    {order.notes}
                                  </div>
                                </div>
                              )}

                              <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ordered Line Items</h4>
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-white">
                                      <th className="py-2 px-4">Product Name</th>
                                      <th className="py-2 px-4 text-center">Ordered Unit</th>
                                      <th className="py-2 px-4 text-right">Ordered Qty</th>
                                      <th className="py-2 px-4 text-right">Converted (Base Qty)</th>
                                      <th className="py-2 px-4 text-right">Unit Price</th>
                                      <th className="py-2 px-4 text-right">Line Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {order.items.map((item) => {
                                      const ordQty = parseFloat(item.orderedQuantity);
                                      const baseQty = parseFloat(item.baseQuantity);
                                      const unitPrice = parseFloat(item.unitPrice);
                                      const lineTot = parseFloat(item.lineTotal);
                                      const prodName = item.product?.name || 'Deleted Product';
                                      const baseUnit = item.product?.baseUnit || '';

                                      // Conversion Check Visual Aid
                                      const isConverted = item.orderedUnit !== baseUnit;

                                      return (
                                        <tr key={item.id} className="hover:bg-slate-50/30">
                                          <td className="py-2.5 px-4 font-medium text-slate-900">{prodName}</td>
                                          <td className="py-2.5 px-4 text-center font-mono text-slate-600">{item.orderedUnit}</td>
                                          <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                                            {ordQty.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                          </td>
                                          <td className="py-2.5 px-4 text-right text-slate-600 font-mono">
                                            <div className="flex flex-col items-end">
                                              <span>{baseQty.toLocaleString(undefined, { maximumFractionDigits: 4 })} {baseUnit}</span>
                                              {isConverted && (
                                                <span className="text-[10px] text-slate-400">
                                                  ({item.orderedQuantity} {item.orderedUnit} &rarr; {item.baseQuantity} {baseUnit})
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-2.5 px-4 text-right font-mono text-slate-500">{formatINR(unitPrice)}</td>
                                          <td className="py-2.5 px-4 text-right font-semibold text-slate-900 font-mono">{formatINR(lineTot)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
