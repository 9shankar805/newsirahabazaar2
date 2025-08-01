import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Minus, 
  Plus, 
  MapPin, 
  Store, 
  ArrowLeft,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAppMode } from "@/hooks/useAppMode";
import { ProductReviews } from "@/components/ProductReviews";
import type { Product, Store as StoreType } from "@shared/schema";
import { getProductImages, getProductFallbackImage } from "@/utils/imageUtils";

export default function ModernProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [storeDistance, setStoreDistance] = useState<string | null>(null);

  // Get user location for distance calculation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    }
  }, []);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const { data: store } = useQuery<StoreType>({
    queryKey: [`/api/stores/${product?.storeId}`],
    enabled: !!product?.storeId,
  });

  const { data: allRelatedProducts = [] } = useQuery<Product[]>({
    queryKey: [`/api/products`, { category: product?.categoryId }],
    enabled: !!product?.categoryId,
  });

  // Calculate distance when store and user location are available
  useEffect(() => {
    if (store?.latitude && store?.longitude && userLocation) {
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      const distance = calculateDistance(
        userLocation.lat, 
        userLocation.lon, 
        Number(store.latitude), 
        Number(store.longitude)
      );

      if (distance < 1) {
        setStoreDistance(`${Math.round(distance * 1000)}m away`);
      } else {
        setStoreDistance(`${distance.toFixed(1)}km away`);
      }
    }
  }, [store, userLocation]);



  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(product.id, quantity);
      toast({
        title: "Added to cart",
        description: `${quantity} ${product.name}(s) added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to cart",
        variant: "destructive",
      });
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

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



  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Product not found</h2>
          <Link href="/products">
            <Button className="bg-orange-500 hover:bg-orange-600">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice 
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0;

  const images = getProductImages(product);
  const isWishlisted = isInWishlist(product.id);

  // Filter related products (excluding current product)
  const relatedProducts = allRelatedProducts
    .filter((relatedProduct: Product) => relatedProduct.id !== product?.id)
    .slice(0, 8); // Limit to 8 related products

  return (
    <div className="min-h-screen bg-white modern-product-detail" style={{ paddingBottom: '144px', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/products')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={handleWishlistToggle}
            >
              <Heart 
                className={`h-5 w-5 ${
                  isWishlisted 
                    ? "fill-red-500 text-red-500" 
                    : "text-gray-600"
                }`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Single Product Image */}
      <div className="relative overflow-hidden">
        <img
          src={images[0] || getProductFallbackImage(product)}
          alt={product.name}
          className="w-full h-80 sm:h-96 object-cover bg-gray-50"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getProductFallbackImage(product);
          }}
          loading="lazy"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <Badge className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-sm font-semibold">
            {discount}% OFF
          </Badge>
        )}
      </div>

      <div className="px-4 py-6 pb-24">
        {/* Product Details */}
        {/* Product Name & Rating */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">
            {product.name}
          </h1>

          {product.rating && parseFloat(product.rating) > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900">
                  {parseFloat(product.rating).toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                (245 reviews)
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-gray-900">
            ₹{Number(product.price).toLocaleString()}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-lg text-gray-400 line-through">
                ₹{Number(product.originalPrice).toLocaleString()}
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Save ₹{(Number(product.originalPrice) - Number(product.price)).toLocaleString()}
              </Badge>
            </>
          )}
        </div>

        {/* Store Info with Visit Store Button */}
        {store && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Store className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{store.name}</p>
                    <p className="text-sm text-gray-600">{store.address}</p>
                  </div>
                  {store.rating && (
                    <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded">
                      <Star className="h-3 w-3 fill-green-600 text-green-600" />
                      <span className="text-xs font-medium text-green-700">{store.rating}</span>
                    </div>
                  )}
                </div>

                {/* Distance and Store Info */}
                <div className="flex items-center gap-4 mb-3">
                  {storeDistance && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{storeDistance}</span>
                    </div>
                  )}
                  {store.deliveryTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>🚚 {store.deliveryTime}</span>
                    </div>
                  )}
                  {store.minimumOrder && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>Min: ₹{store.minimumOrder}</span>
                    </div>
                  )}
                </div>
                <Link href={`/stores/${store.id}`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-orange-600 border-orange-600 hover:bg-orange-50"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Visit Store
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-900 mb-3">Quantity</p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="h-10 w-10 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium w-12 text-center">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
              className="h-10 w-10 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <div className="text-gray-700 leading-relaxed">
              {showFullDescription ? (
                <p>{product.description}</p>
              ) : (
                <p className="line-clamp-3">{product.description}</p>
              )}
              {product.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-orange-500 hover:text-orange-600 mt-2 text-sm font-medium"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Food-specific Info */}
        {product.productType === 'food' && (
          <div className="space-y-4 mb-6">
            {product.preparationTime && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Prep Time:</span>
                <span className="text-sm text-gray-600">{product.preparationTime}</span>
              </div>
            )}

            {product.spiceLevel && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Spice Level:</span>
                <Badge variant="outline" className="capitalize">
                  {product.spiceLevel}
                </Badge>
              </div>
            )}

            <div className="flex gap-2">
              {product.isVegetarian && (
                <Badge className="bg-green-100 text-green-700">Vegetarian</Badge>
              )}
              {product.isVegan && (
                <Badge className="bg-green-100 text-green-700">Vegan</Badge>
              )}
            </div>
          </div>
        )}

        {/* Product Reviews Section */}
        <div className="mb-6">
          <div className="border-t border-gray-100 pt-6">
            <ProductReviews productId={parseInt(id || '0')} productName={product.name} />

          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="px-4 pb-6 mb-20">
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">You might also like</h3>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.id}`}
                  className="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square overflow-hidden bg-gray-50">
                    <img
                      src={getProductImages(relatedProduct)[0]}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                      {relatedProduct.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600 font-bold text-sm">
                        ₹{Number(relatedProduct.price).toLocaleString()}
                      </span>
                      {relatedProduct.originalPrice && (
                        <span className="text-gray-400 line-through text-xs">
                          ₹{Number(relatedProduct.originalPrice).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Cart Button - Above Bottom Navbar */}
      <div className="fixed left-0 right-0 bg-white border-t border-gray-100 p-4 z-[999] fixed-bottom-cart" style={{ position: 'fixed', bottom: '64px', left: 0, right: 0, zIndex: 999 }}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">
              ₹{(Number(product.price) * quantity).toLocaleString()}
            </p>
          </div>
          <Button
            onClick={(e) => {
              console.log('Add to Cart button clicked on mobile');
              handleAddToCart();
            }}
            className="flex-1 modern-cart-button text-white h-12 text-base font-semibold rounded-lg"
            size="lg"
            style={{ 
              minHeight: '48px',
              fontSize: '16px',
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none'
            }}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>


    </div>
  );
}