'use client';

import * as React from 'react';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ShoppingCart, Loader2, IndianRupee } from 'lucide-react';
import { formatINR, getCompatibleUnits, getPriceInUnit, UNIT_CONVERSIONS } from '@/lib/units';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  baseUnit: string;
  basePrice: string; // paise, decimal string
  stockQuantity: string; // base unit quantity, decimal string
}

interface CartItem {
  id: string; // unique item id
  productId: string;
  name: string;
  baseUnit: string;
  basePrice: string;
  chosenUnit: string;
  quantity: number;
  unitPrice: number; // in paise
  lineTotal: number; // in paise
}

export default function SellerProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Search & Filter state
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [unitType, setUnitType] = React.useState(''); // 'g', 'mL', 'unit'
  const [categories, setCategories] = React.useState<string[]>([]);

  // Configure states per product for the 'add to cart' interactive form
  const [selectedUnits, setSelectedUnits] = React.useState<Record<string, string>>({});
  const [quantities, setQuantities] = React.useState<Record<string, string>>({});

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (unitType) params.append('unitType', unitType);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);

      // Extract unique categories for filtering if not already set
      if (categories.length === 0) {
        const uniqueCategories: string[] = Array.from(
          new Set(data.map((p: Product) => p.category).filter(Boolean))
        );
        setCategories(uniqueCategories);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Could not fetch catalog.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [search, category, unitType, categories.length, toast]);

  React.useEffect(() => {
    fetchProducts();
  }, [search, category, unitType, fetchProducts]);

  // Initializing config form settings for products when products load
  React.useEffect(() => {
    const initialUnits: Record<string, string> = {};
    const initialQtys: Record<string, string> = {};
    products.forEach((p) => {
      initialUnits[p.id] = p.baseUnit;
      initialQtys[p.id] = '1';
    });
    setSelectedUnits((prev) => ({ ...initialUnits, ...prev }));
    setQuantities((prev) => ({ ...initialQtys, ...prev }));
  }, [products]);

  const handleUnitChange = (productId: string, unit: string) => {
    setSelectedUnits((prev) => ({ ...prev, [productId]: unit }));
  };

  const handleQuantityChange = (productId: string, qty: string) => {
    setQuantities((prev) => ({ ...prev, [productId]: qty }));
  };

  const addToCart = (product: Product) => {
    const chosenUnit = selectedUnits[product.id] || product.baseUnit;
    const qtyStr = quantities[product.id] || '1';
    const quantity = parseFloat(qtyStr);

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid positive number.',
        variant: 'warning',
      });
      return;
    }

    const basePricePaise = parseFloat(product.basePrice);
    const unitPricePaise = getPriceInUnit(basePricePaise, chosenUnit);
    const lineTotalPaise = quantity * unitPricePaise;

    // Retrieve existing cart
    let cart: CartItem[] = [];
    try {
      const savedCart = localStorage.getItem('aasamedchem_cart');
      if (savedCart) cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }

    // Generate unique ID for this cart item configuration
    const cartItemId = `${product.id}-${chosenUnit}`;
    const existingIndex = cart.findIndex((item) => item.id === cartItemId);

    if (existingIndex > -1) {
      // Add quantity to existing item
      cart[existingIndex].quantity += quantity;
      cart[existingIndex].lineTotal = cart[existingIndex].quantity * cart[existingIndex].unitPrice;
    } else {
      cart.push({
        id: cartItemId,
        productId: product.id,
        name: product.name,
        baseUnit: product.baseUnit,
        basePrice: product.basePrice,
        chosenUnit,
        quantity,
        unitPrice: unitPricePaise,
        lineTotal: lineTotalPaise,
      });
    }

    localStorage.setItem('aasamedchem_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));

    toast({
      title: 'Added to Cart',
      description: `${quantity} ${chosenUnit} of ${product.name} added.`,
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Browse Catalog</h1>
        <p className="text-slate-500 mt-1">Select units and quantities to compile your order requisition.</p>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 grid gap-4 md:grid-cols-4 items-center">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="input-seller-search"
              type="text"
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="select-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Dimension Filter */}
          <div>
            <select
              id="select-unit-type"
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="">All Dimensions</option>
              <option value="g">Weight (g/kg)</option>
              <option value="mL">Volume (mL/L)</option>
              <option value="unit">Count (unit)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Catalog Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-slate-950 mb-3" />
          <span>Loading catalog items...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
          No products match your filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const stockQty = parseFloat(product.stockQuantity);
            const basePricePaise = parseFloat(product.basePrice);
            const compatibleUnits = getCompatibleUnits(product.baseUnit);
            
            // Live Preview Calculation
            const currentUnit = selectedUnits[product.id] || product.baseUnit;
            const currentQtyStr = quantities[product.id] || '1';
            const currentQty = parseFloat(currentQtyStr) || 0;
            const currentUnitPrice = getPriceInUnit(basePricePaise, currentUnit);
            const liveTotalPaise = currentQty * currentUnitPrice;

            return (
              <Card key={product.id} className="flex flex-col h-full hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold text-slate-400 font-mono tracking-wider">
                      {product.sku || 'NO SKU'}
                    </span>
                    <Badge variant="secondary">{product.category || 'Uncategorized'}</Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 mt-1">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px] text-slate-500 mt-1">
                    {product.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  {/* Stock levels */}
                  <div className="flex justify-between items-center text-xs py-2 border-y border-slate-100 mb-3">
                    <span className="text-slate-500">Available Stock:</span>
                    <span className={`font-semibold ${stockQty <= 10 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                      {stockQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} {product.baseUnit}
                    </span>
                  </div>

                  {/* Unit price listings */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Price breakdown:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {compatibleUnits.map((unit) => {
                        const priceInUnit = getPriceInUnit(basePricePaise, unit);
                        return (
                          <div key={unit} className="bg-slate-50 p-2 rounded border border-slate-100 flex flex-col">
                            <span className="text-slate-500 font-medium">Per {unit}:</span>
                            <span className="font-bold text-slate-900">{formatINR(priceInUnit)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Configuration Input */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase" htmlFor={`unit-select-${product.id}`}>Unit</label>
                      <select
                        id={`unit-select-${product.id}`}
                        value={currentUnit}
                        onChange={(e) => handleUnitChange(product.id, e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        {compatibleUnits.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase" htmlFor={`qty-input-${product.id}`}>Qty</label>
                      <input
                        id={`qty-input-${product.id}`}
                        type="number"
                        step="any"
                        min="0"
                        value={currentQtyStr}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </CardContent>

                {/* Live total display & Add to Cart button */}
                <CardFooter className="bg-slate-50/50 p-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Total Price:</span>
                    <span className="text-md font-bold text-slate-900 font-mono">
                      {formatINR(liveTotalPaise)}
                    </span>
                  </div>
                  <Button
                    id={`btn-add-cart-${product.id}`}
                    size="sm"
                    className="flex items-center space-x-1"
                    onClick={() => addToCart(product)}
                    disabled={stockQty <= 0}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
