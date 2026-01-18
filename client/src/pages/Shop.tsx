import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ui/ProductCard";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Shop() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get("category");
  
  const [search, setSearch] = useState("");
  
  // Fetch products, filtering by category if present in URL
  const { data: products, isLoading, error } = useProducts(categoryParam || undefined);

  // Client-side search filtering
  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ["All", "Shoes", "Cosmetics"];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="font-display font-bold text-4xl mb-2">Shop Collection</h1>
          <p className="text-muted-foreground">Find the best items for your style</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
        {categories.map((cat) => {
          const isActive = cat === "All" ? !categoryParam : categoryParam === cat;
          const href = cat === "All" ? "/shop" : `/shop?category=${cat}`;
          
          return (
            <Button
              key={cat}
              variant={isActive ? "default" : "outline"}
              className="rounded-full px-6"
              asChild
            >
              <a href={href}>{cat}</a>
            </Button>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-destructive mb-2">Something went wrong</h3>
          <p className="text-muted-foreground">We couldn't load the products. Please try again later.</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-[400px] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts?.length === 0 && (
        <div className="text-center py-20 bg-muted/30 rounded-2xl">
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
          <Button onClick={() => setSearch("")} variant="outline">Clear Search</Button>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
