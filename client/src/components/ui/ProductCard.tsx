import { type Product } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { motion } from "framer-motion";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const formattedPrice = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(product.price);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
        <img
          src={product.imageUrl || `https://placehold.co/600x400?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg px-4 py-2 border-2 border-white">SOLD OUT</span>
          </div>
        )}
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{product.category}</div>
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold text-primary">{formattedPrice}</span>
          <Button 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            disabled={product.stock <= 0}
            className="rounded-full px-6"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
