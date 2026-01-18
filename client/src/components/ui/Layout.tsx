import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingBag, User, LogOut, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CartDrawer } from "./CartDrawer";
import { useState } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const { cartCount, setIsOpen: setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.email?.includes("admin");

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Dashboard" }] : []),
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-display font-bold text-2xl tracking-tighter hover:opacity-80 transition-opacity">
              LUXE<span className="text-primary/60">STORE</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href) ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full overflow-hidden border border-border/50">
                     {user.profileImageUrl ? (
                       <img src={user.profileImageUrl} alt="Avatar" className="h-8 w-8 object-cover" />
                     ) : (
                       <User className="h-5 w-5" />
                     )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full">Order History</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer w-full flex items-center">
                        <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm" className="hidden md:flex">
                <a href="/api/login">Log In</a>
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-8 mt-8">
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="font-display font-bold text-2xl">
                    LUXE<span className="text-primary/60">STORE</span>
                  </Link>
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`text-lg font-medium transition-colors ${
                          isActive(link.href) ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    {!user && (
                      <a 
                        href="/api/login"
                        className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors mt-4"
                      >
                        Log In
                      </a>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <CartDrawer />

      <footer className="border-t py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="font-display font-bold text-xl mb-4">LUXE<span className="text-primary/60">STORE</span></h3>
              <p className="text-muted-foreground max-w-sm">
                Premium e-commerce destination for shoes and cosmetics. Quality products, seamless shopping experience.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/shop?category=Shoes" className="hover:text-primary transition-colors">Shoes</Link></li>
                <li><Link href="/shop?category=Cosmetics" className="hover:text-primary transition-colors">Cosmetics</Link></li>
                <li><Link href="/shop" className="hover:text-primary transition-colors">All Products</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>Shipping Information</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} LuxeStore. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
