import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import DistanceBasedProductSearch from "@/components/DistanceBasedProductSearch";
import { useAppMode } from "@/hooks/useAppMode";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter } from "lucide-react";
import { Link } from "wouter";

export default function Products() {
  const [location, setLocation] = useLocation();
  const { mode } = useAppMode();
  
  // Get search params directly from window.location.search instead of wouter location
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [selectedCategory, setSelectedCategory] = useState('');

  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category');

  // Categories for filtering
  const categories = [
    { id: '', label: 'All Categories' },
    { id: '1', label: 'Electronics' },
    { id: '2', label: 'Fashion & Clothing' },
    { id: '3', label: 'Food & Beverages' },
    { id: '4', label: 'Health & Pharmacy' },
    { id: '5', label: 'Sports & Fitness' },
    { id: '6', label: 'Books & Education' },
    { id: '7', label: 'Beauty & Personal Care' },
    { id: '8', label: 'Toys & Games' },
    { id: '9', label: 'Home & Garden' },
    { id: '10', label: 'Automotive' },
    { id: '11', label: 'Music & Entertainment' },
  ];

  useEffect(() => {
    // Update search params when URL changes
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
    const catQuery = params.get('category') || '';
    setSelectedCategory(catQuery);
    console.log("Products page location changed:", { 
      location, 
      searchQuery: params.get('search'), 
      categoryQuery: params.get('category'),
      fullURL: window.location.href,
      windowSearch: window.location.search,
      hasSearchParam: window.location.search.includes('search=')
    });
  }, [location]);

  // Force refresh search params when window location changes
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
      console.log("Window location changed (forced refresh):", {
        search: params.get('search'),
        windowSearch: window.location.search
      });
    };

    // Listen for both popstate and custom location changes
    window.addEventListener('popstate', handleLocationChange);
    
    // Also check periodically for location changes (fallback)
    const interval = setInterval(() => {
      const currentSearch = window.location.search;
      const currentSearchQuery = new URLSearchParams(currentSearch).get('search') || '';
      if (currentSearchQuery !== searchQuery) {
        console.log("Location change detected via polling");
        handleLocationChange();
      }
    }, 100);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, [searchQuery]);

  // Handle category filter change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(window.location.search);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    const newUrl = `/products?${params.toString()}`;
    setLocation(newUrl);
  };

  console.log("Products page rendering with:", { searchQuery, categoryQuery, selectedCategory });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">
              {mode === 'food' ? 'Food Items' : 'Products'}
            </h1>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Use the new distance-based product search component */}
        <DistanceBasedProductSearch 
          searchQuery={searchQuery}
          category={categoryQuery || selectedCategory || ""}
          isRestaurantMode={mode === 'food'}
        />
      </div>
    </div>
  );
}