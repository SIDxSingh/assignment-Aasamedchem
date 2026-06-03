'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, LogOut, Package, ClipboardList, LayoutDashboard, User, Menu, X } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [cartCount, setCartCount] = React.useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Sync cart count from localStorage for SELLER
  const updateCartCount = React.useCallback(() => {
    try {
      const savedCart = localStorage.getItem('aasamedchem_cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartCount(items.length);
      } else {
        setCartCount(0);
      }
    } catch (e) {
      setCartCount(0);
    }
  }, []);

  React.useEffect(() => {
    updateCartCount();

    // Listen for custom events when cart is updated
    window.addEventListener('cart-updated', updateCartCount);
    // Listen for storage events across tabs
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('cart-updated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, [updateCartCount]);

  if (!session) return null;

  const role = session.user?.role;
  const isAdmin = role === 'ADMIN';

  const navLinks = isAdmin
    ? [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/products', label: 'Products', icon: Package },
        { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
      ]
    : [
        { href: '/seller/products', label: 'Browse Products', icon: Package },
        { href: '/seller/cart', label: 'Cart', icon: ShoppingCart, isCart: true },
        { href: '/seller/orders', label: 'My Orders', icon: ClipboardList },
      ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                AasaMedChem Inventory
              </span>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="ml-2 font-mono">
                {role}
              </Badge>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  id={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  href={link.href}
                  className={`flex items-center space-x-1.5 text-sm font-medium transition-colors hover:text-slate-950 ${
                    isActive ? 'text-slate-950 border-b-2 border-slate-900 px-0.5 py-5 -mb-0.5' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.isCart && cartCount > 0 && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User info and Sign out */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <User className="w-4 h-4" />
              <span className="max-w-[150px] truncate font-medium">{session.user?.email}</span>
            </div>
            <Button id="btn-sign-out" variant="ghost" size="sm" onClick={handleSignOut} className="flex items-center space-x-1">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button
              id="btn-mobile-menu"
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  id={`nav-link-mobile-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                    isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </div>
                  {link.isCart && cartCount > 0 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-200 pt-3 flex flex-col space-y-2">
            <div className="flex items-center space-x-2 px-3 text-sm text-slate-500">
              <User className="w-4 h-4" />
              <span className="truncate">{session.user?.email}</span>
            </div>
            <Button id="btn-mobile-sign-out" variant="outline" size="sm" onClick={handleSignOut} className="w-full flex items-center justify-center space-x-1">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
