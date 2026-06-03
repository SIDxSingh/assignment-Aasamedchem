'use client';

import * as React from 'react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, X, Loader2 } from 'lucide-react';
import { formatINR, getCompatibleUnits, getPriceInUnit } from '@/lib/units';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  baseUnit: string;
  basePrice: string; // stored in paise, decimal string
  stockQuantity: string; // decimal string
  isActive: boolean;
}

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  // Form states
  const [name, setName] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [baseUnit, setBaseUnit] = React.useState('g');
  const [basePrice, setBasePrice] = React.useState(''); // in Rupees
  const [stockQuantity, setStockQuantity] = React.useState(''); // in base unit
  const [formSubmiting, setFormSubmitting] = React.useState(false);

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const fetchProducts = React.useCallback(async (search = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load products.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchProducts(searchQuery);
  }, [searchQuery, fetchProducts]);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedProduct(null);
    setName('');
    setSku('');
    setDescription('');
    setCategory('');
    setBaseUnit('g');
    setBasePrice('');
    setStockQuantity('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setModalMode('edit');
    setSelectedProduct(product);
    setName(product.name);
    setSku(product.sku || '');
    setDescription(product.description || '');
    setCategory(product.category || '');
    setBaseUnit(product.baseUnit);
    // Convert base price from paise to rupees for form display
    setBasePrice((parseFloat(product.basePrice) / 100).toString());
    setStockQuantity(product.stockQuantity);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !baseUnit || !basePrice || !stockQuantity) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'warning',
      });
      return;
    }

    setFormSubmitting(true);
    const payload = {
      name,
      sku: sku.trim() || null,
      description: description.trim() || null,
      category: category.trim() || null,
      baseUnit,
      basePrice: parseFloat(basePrice),
      stockQuantity: parseFloat(stockQuantity),
    };

    try {
      let res;
      if (modalMode === 'add') {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/products/${selectedProduct?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save product');
      }

      toast({
        title: 'Success',
        description: `Product ${modalMode === 'add' ? 'created' : 'updated'} successfully.`,
        variant: 'success',
      });
      setIsModalOpen(false);
      fetchProducts(searchQuery);
    } catch (err: any) {
      toast({
        title: 'Error Saving Product',
        description: err.message,
        variant: 'danger',
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete product');
      toast({
        title: 'Success',
        description: 'Product deleted successfully.',
        variant: 'success',
      });
      setDeleteConfirmId(null);
      fetchProducts(searchQuery);
    } catch (err: any) {
      toast({
        title: 'Error Deleting Product',
        description: err.message,
        variant: 'danger',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products Management</h1>
          <p className="text-slate-500 mt-1">Add, update, and manage your inventory items and their base units.</p>
        </div>
        <Button id="btn-add-product" onClick={openAddModal} className="flex items-center space-x-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="input-product-search"
              type="text"
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-slate-950 mb-2" />
              <span>Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No active products found matching your search.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">SKU</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6 text-right">Available Stock</th>
                  <th className="py-3 px-6">Base Unit</th>
                  <th className="py-3 px-6">Price Breakdown</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map((product) => {
                  const basePricePaise = parseFloat(product.basePrice);
                  const stockQty = parseFloat(product.stockQuantity);
                  const compatibleUnits = getCompatibleUnits(product.baseUnit);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900">{product.name}</td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-xs">{product.sku || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <Badge variant="secondary">{product.category || 'Uncategorized'}</Badge>
                      </td>
                      <td className={`py-4 px-6 text-right font-semibold ${stockQty <= 10 ? 'text-red-600' : 'text-slate-900'}`}>
                        {stockQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-slate-600">{product.baseUnit}</td>
                      <td className="py-4 px-6 text-xs text-slate-600 leading-relaxed">
                        {compatibleUnits.map((unit) => {
                          const priceInUnit = getPriceInUnit(basePricePaise, unit);
                          return (
                            <div key={unit} className="flex justify-between w-32 border-b border-slate-100 py-0.5">
                              <span className="font-semibold text-slate-900">{unit}:</span>
                              <span>{formatINR(priceInUnit)}</span>
                            </div>
                          );
                        })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            id={`btn-edit-product-${product.id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(product)}
                            className="p-1.5"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </Button>
                          {deleteConfirmId === product.id ? (
                            <div className="flex items-center space-x-1 animate-pulse">
                              <Button
                                id={`btn-delete-confirm-${product.id}`}
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="px-2 py-1 text-xs h-7"
                              >
                                Confirm
                              </Button>
                              <Button
                                id={`btn-delete-cancel-${product.id}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-xs h-7"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              id={`btn-delete-product-${product.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(product.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-lg bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-xl font-bold">
                  {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
                </CardTitle>
                <CardDescription>
                  {modalMode === 'add'
                    ? 'Enter product details to create a new item.'
                    : 'Modify product parameters.'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase" htmlFor="prod-name">
                      Product Name *
                    </label>
                    <input
                      id="prod-name"
                      type="text"
                      required
                      placeholder="e.g. Sodium Chloride"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase" htmlFor="prod-sku">
                      SKU (Unique)
                    </label>
                    <input
                      id="prod-sku"
                      type="text"
                      placeholder="e.g. CHEM-NaCl-001"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase" htmlFor="prod-category">
                      Category
                    </label>
                    <input
                      id="prod-category"
                      type="text"
                      placeholder="e.g. Reagents"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase" htmlFor="prod-desc">
                      Description
                    </label>
                    <textarea
                      id="prod-desc"
                      placeholder="Product details and specifications..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase" htmlFor="prod-unit">
                      Base Unit *
                    </label>
                    <select
                      id="prod-unit"
                      value={baseUnit}
                      onChange={(e) => setBaseUnit(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    >
                      <option value="g">g (Weight)</option>
                      <option value="mL">mL (Volume)</option>
                      <option value="unit">unit (Count)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase" htmlFor="prod-price">
                      Base Price (in ₹ per base unit) *
                    </label>
                    <input
                      id="prod-price"
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 0.50"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase" htmlFor="prod-qty">
                      Stock Quantity (in base unit: {baseUnit}) *
                    </label>
                    <input
                      id="prod-qty"
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 5000"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-4">
                <Button id="btn-prod-modal-cancel" type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button id="btn-prod-modal-save" type="submit" disabled={formSubmiting}>
                  {formSubmiting ? 'Saving...' : 'Save Product'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
