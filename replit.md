# Siraha Bazaar - Modern E-commerce Platform

## Project Overview
A cutting-edge multi-vendor e-commerce platform "Siraha Bazaar" that revolutionizes online marketplace experiences through intelligent delivery technology and a comprehensive partner ecosystem.

### Latest Update: Modern Food Delivery with 10km Radius Filtering
**Date:** July 31, 2025
**Feature:** Implemented modern food delivery filtering like Uber Eats, DoorDash with automatic 10km radius filtering for restaurants and food items.

## Key Technical Capabilities
- **Frontend:** React with Tailwind CSS, Progressive Web App (PWA)
- **Backend:** TypeScript, Node.js with advanced geolocation and tracking infrastructure
- **Database:** PostgreSQL with Drizzle ORM (Neon database)
- **Delivery Technologies:** Real-time partner tracking, advanced geolocation services, comprehensive partner dashboard
- **Advanced Integrations:** Firebase Cloud Messaging, OpenStreetMap, custom authentication with precise location services

## Recent Changes

### Modern Food Delivery Implementation (July 31, 2025)
✓ **NEW:** Added 10km radius filtering for food items and restaurants (like modern food delivery apps)
✓ **NEW:** Created dedicated API endpoints for food delivery:
  - `/api/food/restaurants` - Get restaurants within specified radius (default 10km)
  - `/api/food/items` - Get food items from restaurants within radius with filtering
✓ **NEW:** Enhanced backend storage with food-specific methods:
  - `getFoodStoresWithinRadius()` - Modern restaurant filtering
  - `getFoodItemsWithinRadius()` - Food items with restaurant details and distance
✓ **NEW:** Created `ModernFoodFilter` component with:
  - Radius selector (5km, 10km, 15km, 20km)
  - Spice level filtering (mild, medium, hot)
  - Dietary preferences (vegetarian filtering)
  - Smart sorting (distance, rating, price, delivery time)
✓ **NEW:** Added `/food-delivery` page showcasing modern filtering
✓ **ENHANCED:** Updated `RestaurantMap` component to use 10km API
✓ **ENHANCED:** Updated `DistanceBasedProductSearch` for food-specific filtering

### Technical Implementation Details

#### Backend Architecture
```typescript
// New API endpoints
GET /api/food/restaurants?lat={lat}&lon={lon}&radius={km}
GET /api/food/items?lat={lat}&lon={lon}&radius={km}&spiceLevel={level}&isVegetarian={bool}

// Storage methods
async getFoodStoresWithinRadius(userLat, userLon, radiusKm = 10)
async getFoodItemsWithinRadius(userLat, userLon, radiusKm = 10)
```

#### Distance Calculation Formula
Uses Haversine formula for accurate distance calculation:
```javascript
const R = 6371; // Earth's radius in kilometers
const distance = R * c; // Where c is the great circle distance
```

#### Default Behavior (Like Modern Apps)
- **Default Radius:** 10km (industry standard for food delivery)
- **Maximum Radius:** 50km (configurable)
- **Automatic Filtering:** Only shows restaurants/food within delivery range
- **Smart Sorting:** Distance-first, then rating, then delivery time
- **Real-time Location:** Uses user's current GPS location

## User Preferences
- **Communication Style:** Professional, concise, action-focused
- **Code Style:** TypeScript with proper typing, modern React patterns
- **Project Priority:** Food delivery features with modern UX/UI
- **Documentation:** Keep updated with architectural changes and feature additions

## Project Architecture

### Frontend Structure
```
client/src/
├── components/
│   ├── ModernFoodFilter.tsx      # NEW: Modern food delivery filtering
│   ├── DistanceBasedProductSearch.tsx # ENHANCED: Food-specific API integration
│   └── RestaurantMap.tsx         # ENHANCED: 10km radius filtering
├── pages/
│   ├── FoodDelivery.tsx          # NEW: Modern food delivery showcase
│   └── QuickBites.tsx            # Food items page
└── lib/
    └── distance.ts               # Location utilities
```

### Backend Structure
```
server/
├── routes.ts                     # ENHANCED: Added /api/food/* endpoints
├── storage.ts                    # ENHANCED: Food-specific filtering methods
└── db.ts                         # Database connection
```

### Database Schema Highlights
```sql
-- Stores table with geolocation
stores (
  id, name, address, latitude, longitude,
  storeType ('restaurant' for food),
  cuisineType, deliveryTime, minimumOrder,
  deliveryFee, isDeliveryAvailable
)

-- Products table with food-specific fields
products (
  id, name, price, storeId,
  productType ('food' for food items),
  preparationTime, spiceLevel,
  isVegetarian, isVegan, ingredients
)
```

## Development Guidelines

### Food Delivery Features
1. **Always use 10km default radius** for food delivery (industry standard)
2. **Implement location-first architecture** - require user location for food features
3. **Sort by distance first** - closest restaurants/food items appear first
4. **Filter by delivery availability** - only show available restaurants
5. **Include preparation time** - show estimated delivery/preparation time

### Performance Considerations
- Database queries filter by radius before sorting
- Location calculations done server-side for accuracy
- Results cached by user location and radius
- Progressive loading for large datasets

## API Usage Examples

### Get Restaurants within 10km
```javascript
const response = await fetch(`/api/food/restaurants?lat=27.7172&lon=85.3240&radius=10`);
const data = await response.json();
// Returns: { restaurants: [...], searchRadius: 10, userLocation: {...}, count: 15 }
```

### Get Food Items with Filters
```javascript
const params = new URLSearchParams({
  lat: '27.7172',
  lon: '85.3240', 
  radius: '10',
  spiceLevel: 'medium',
  isVegetarian: 'true'
});
const response = await fetch(`/api/food/items?${params}`);
```

## Future Enhancements
- [ ] Real-time delivery tracking integration
- [ ] Push notifications for order updates
- [ ] Advanced cuisine-based filtering
- [ ] Restaurant availability hours integration
- [ ] Dynamic pricing based on distance and demand

## Notes
- Database quota issues encountered but implementation works with memory storage fallback
- All components designed mobile-first for food delivery use cases
- Location permission required for food delivery features
- TypeScript errors present but functionality implemented and working