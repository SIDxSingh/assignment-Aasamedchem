'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Package, AlertTriangle, Clock, IndianRupee, ArrowRight, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/units';

interface Stats {
  totalProducts: number;
  lowStockItems: number;
  pendingOrders: number;
  totalRevenue: number; // in paise
}

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Failed to load stats');
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message || 'Could not fetch dashboard metrics.',
          variant: 'danger',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-slate-900 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">Loading Dashboard Metrics...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Real-time overview of your warehouse stock, orders, and revenue.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-900">
              <Package className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Active items in catalog</p>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className={`hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${stats && stats.lowStockItems > 0 ? 'border-red-200 bg-red-50/10' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Low Stock Items</span>
            <div className={`p-2 rounded-lg ${stats && stats.lowStockItems > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-900'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats && stats.lowStockItems > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {stats?.lowStockItems || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Stock quantity &le; 10 units</p>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className={`hover:-translate-y-1 hover:shadow-md transition-all duration-300 ${stats && stats.pendingOrders > 0 ? 'border-amber-200 bg-amber-50/10' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</span>
            <div className={`p-2 rounded-lg ${stats && stats.pendingOrders > 0 ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-900'}`}>
              <Clock className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats && stats.pendingOrders > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {stats?.pendingOrders || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Requires admin approval</p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {formatINR(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">From confirmed &amp; fulfilled orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Catalog Operations</CardTitle>
            <CardDescription>Configure products, modify quantities, base units, and price settings.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/admin/products">
              <Button className="w-full flex items-center justify-center space-x-2">
                <span>Go to Products Management</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Fulfilment</CardTitle>
            <CardDescription>Approve pending requests, cancel order lines, and inspect unit conversion items.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link href="/admin/orders">
              <Button className="w-full flex items-center justify-center space-x-2" variant="outline">
                <span>Manage Seller Orders</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
