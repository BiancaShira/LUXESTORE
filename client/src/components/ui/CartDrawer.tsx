import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export function CartDrawer() {
  const { items, removeFromCart, updateQuantity, cartTotal, isOpen, setIsOpen } = useCart();
  const [, setLocation] = useLocation();

  const formattedTotal = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(cartTotal);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:w-[540px] flex flex-col">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-2xl">Shopping Cart</SheetTitle>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Looks like you haven't added anything yet.</p>
            <Button onClick={() => setIsOpen(false)} variant="outline">Continue Shopping</Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-4">
                    <div className="h-24 w-24 rounded-lg bg-muted overflow-hidden flex-shrink-0 border">
                      <img
                        src={product.imageUrl || `https://placehold.co/200?text=${encodeURIComponent(product.name)}`}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium line-clamp-1">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                        <p className="font-semibold">
                          {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(product.price)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-1 border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            disabled={quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(product.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-auto pt-6">
              <Separator className="mb-4" />
              <div className="flex justify-between items-center mb-6">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-2xl font-display font-bold">{formattedTotal}</span>
              </div>
              <SheetFooter className="flex-col gap-3 sm:flex-col sm:space-x-0">
                <Button 
                  size="lg" 
                  className="w-full text-lg" 
                  onClick={() => {
                    setIsOpen(false);
                    setLocation("/checkout");
                  }}
                >
                  Checkout
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Continue Shopping
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
