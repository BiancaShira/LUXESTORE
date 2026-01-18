import { useRoute } from "wouter";
import { useProduct } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, ShoppingBag, Truck } from "lucide-react";
import { Link } from "wouter";

export default function ProductDetails() {
  const [, params] = useRoute("/products/:id");
  const id = parseInt(params?.id || "0");
  const { data: product, isLoading, error } = useProduct(id);
  const { addToCart } = useCart();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="h-[500px] bg-muted rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
            <div className="h-32 w-full bg-muted rounded animate-pulse mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link href="/shop"><Button>Back to Shop</Button></Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(product.price);

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image Section */}
        <div className="relative rounded-2xl overflow-hidden bg-muted border aspect-square">
          <img
            src={product.imageUrl || `https://placehold.co/800x800?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details Section */}
        <div>
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">{product.category}</Badge>
          <h1 className="font-display font-bold text-4xl mb-4 text-foreground">{product.name}</h1>
          <p className="text-3xl font-bold text-primary mb-6">{formattedPrice}</p>
          
          <div className="prose prose-stone max-w-none text-muted-foreground mb-8">
            <p>{product.description}</p>
          </div>

          <div className="space-y-6 pt-6 border-t">
            <div className="flex items-center gap-4">
              <Button 
                size="lg" 
                className="flex-1 text-lg h-14 rounded-xl"
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span>Free delivery over KES 5,000</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span>Authenticity Guaranteed</span>
              </div>
            </div>
            
            {product.stock < 5 && product.stock > 0 && (
              <p className="text-sm text-orange-600 font-medium animate-pulse">
                Only {product.stock} left in stock - order soon!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
