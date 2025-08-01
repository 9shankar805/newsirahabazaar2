import { Link } from "wouter";
import { Star, ShoppingCart, Heart, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { getProductImage, getProductFallbackImage } from "@/utils/imageUtils";

interface ProductCardProps {
  product: Product & {
    storeDistance?: number;
    storeName?: string;
    deliveryTime?: string;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Allow adding to cart even without login
    addToCart(product.id, 1);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to add items to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    const wasInWishlist = isInWishlist(product.id);
    await toggleWishlist(product.id);
    
    toast({
      title: wasInWishlist ? "Removed from wishlist" : "Added to wishlist",
      description: `${product.name} has been ${wasInWishlist ? "removed from" : "added to"} your wishlist.`,
    });
  };

  const discount = product.originalPrice 
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="product-card overflow-hidden">
        <div className="relative">
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="w-full h-40 sm:h-48 md:h-56 lg:h-60 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('unsplash')) {
                target.src = getProductFallbackImage(product);
              }
            }}
            loading="lazy"
          />
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              {discount}% OFF
            </Badge>
          )}
        </div>
        
        <div className="p-2">
          <h3 className="font-medium text-foreground text-[10px] mb-1 line-clamp-2">
            {product.name}
          </h3>
          
          {/* Restaurant name and distance info for food items */}
          {product.storeName && (
            <div className="text-[9px] text-muted-foreground mb-1 flex items-center justify-between">
              <span className="truncate">{product.storeName}</span>
              {product.storeDistance !== undefined && (
                <div className="flex items-center gap-1 text-[8px] text-blue-600">
                  <MapPin className="h-2 w-2" />
                  <span>{product.storeDistance.toFixed(1)}km</span>
                </div>
              )}
            </div>
          )}
          
          {/* Delivery time for food items */}
          {product.deliveryTime && (
            <div className="text-[8px] text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="h-2 w-2" />
              <span>{product.deliveryTime}</span>
            </div>
          )}
          
          {/* Rating display */}
          {product.rating && parseFloat(product.rating) > 0 && (
            <div className="flex items-center gap-1 mb-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] text-gray-600">
                {parseFloat(product.rating).toFixed(1)}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-1 mb-2">
            <span className="text-xs font-bold text-foreground">
              ₹{Number(product.price).toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] text-muted-foreground line-through">
                ₹{Number(product.originalPrice).toLocaleString()}
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleAddToCart}
              className="flex-1 btn-secondary text-xs py-1 h-8"
              size="sm"
            >
              <ShoppingCart className="h-3 w-3" />
            </Button>
            <Button
              onClick={handleWishlistToggle}
              variant="outline"
              className="text-xs py-1 h-8 w-8 p-0"
              size="sm"
            >
              <Heart 
                className={`h-3 w-3 transition-colors ${
                  isInWishlist(product.id) 
                    ? "fill-red-500 text-red-500" 
                    : "text-gray-600 hover:text-red-400"
                }`}
              />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
