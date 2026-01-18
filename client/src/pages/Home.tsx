import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Sparkles, TrendingUp, Truck } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: products, isLoading } = useProducts();

  // Featured products (first 4)
  const featuredProducts = products?.slice(0, 4);

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative h-[600px] md:h-[700px] flex items-center overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
          {/* Unsplash image: Fashion/Store background */}
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Background" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        <div className="container relative z-20 mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="font-display font-bold text-5xl md:text-7xl leading-tight mb-6">
              Elevate Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Everyday Style</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg">
              Discover our curated collection of premium footwear and exclusive cosmetics designed to help you stand out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/shop">
                <Button size="lg" className="text-lg px-8 h-14 rounded-full bg-white text-primary hover:bg-gray-100">
                  Shop Collection
                </Button>
              </Link>
              <Link href="/shop?category=Shoes">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full border-white text-white hover:bg-white/10 hover:text-white">
                  Browse Shoes
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Sparkles, title: "Premium Quality", text: "Hand-picked items from top global brands." },
            { icon: Truck, title: "Fast Delivery", text: "Free shipping on orders over KES 5,000." },
            { icon: TrendingUp, title: "Latest Trends", text: "New arrivals added to the collection weekly." },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-2xl border border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display font-bold text-3xl">Trending Now</h2>
          <Link href="/shop" className="text-primary font-medium flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-[400px] bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Categories Banner */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shoes Category */}
          <Link href="/shop?category=Shoes">
            <div className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop" 
                alt="Shoes"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <h3 className="font-display font-bold text-4xl mb-4">Shoes</h3>
                <span className="border-b-2 border-white pb-1 opacity-0 group-hover:opacity-100 transition-opacity">Shop Now</span>
              </div>
            </div>
          </Link>
          
          {/* Cosmetics Category */}
          <Link href="/shop?category=Cosmetics">
            <div className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer">
              <img 
                src="https://pixabay.com/get/g32879ac3f37494095fa6a345c659ccd6b2c3cfaf6333cc5bbf5c36948426c36d835c3b9956b237f446ae7cd267dec60d1a645214fdb3613bc22c89216ee9c2b0_1280.jpg" 
                alt="Cosmetics"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <h3 className="font-display font-bold text-4xl mb-4">Cosmetics</h3>
                <span className="border-b-2 border-white pb-1 opacity-0 group-hover:opacity-100 transition-opacity">Shop Now</span>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
