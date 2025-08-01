import { db } from './server/db.ts';
import { products } from './shared/schema.ts';

async function addMultiImageProducts() {
  console.log('Adding products with multiple images for testing...');
  
  try {
    // Sample products with multiple high-quality images
    const multiImageProducts = [
      {
        name: "iPhone 15 Pro Max",
        slug: "iphone-15-pro-max",
        description: "Latest iPhone with titanium design and advanced camera system",
        price: "149900",
        originalPrice: "159900",
        storeId: 1, // Electronics store
        categoryId: 1,
        stock: 25,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1695048059149-ac4c4d585cdc?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1695048576165-56c8259a41e6?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1695048374656-6b2ae6c96e3a?w=400&h=300&fit=crop&auto=format"
        ],
        isOnOffer: true,
        offerPercentage: 6,
        productType: 'product',
        isFastSell: true,
        rating: "4.8"
      },
      {
        name: "Gaming Laptop RTX 4080",
        slug: "gaming-laptop-rtx-4080",
        description: "High-performance gaming laptop with RTX 4080 graphics",
        price: "189999",
        originalPrice: "209999",
        storeId: 1,
        categoryId: 1,
        stock: 12,
        images: [
          "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1564473994782-78c3ca98fb66?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop&auto=format"
        ],
        isOnOffer: true,
        offerPercentage: 10,
        productType: 'product',
        isFastSell: true,
        rating: "4.7"
      },
      {
        name: "Premium Sneakers Collection",
        slug: "premium-sneakers-collection",
        description: "Limited edition designer sneakers with premium materials",
        price: "8999",
        originalPrice: "12999",
        storeId: 1, // Fashion store
        categoryId: 2,
        stock: 35,
        images: [
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&auto=format"
        ],
        isOnOffer: true,
        offerPercentage: 31,
        productType: 'product',
        isFastSell: true,
        rating: "4.6"
      },
      {
        name: "Margherita Pizza Deluxe",
        slug: "margherita-pizza-deluxe",
        description: "Fresh mozzarella, tomato sauce, and basil on wood-fired crust",
        price: "549",
        originalPrice: "649",
        storeId: 1, // Restaurant
        categoryId: 13, // Main Courses
        stock: 50,
        images: [
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop&auto=format"
        ],
        productType: 'food',
        isVegetarian: true,
        preparationTime: "25 minutes",
        spiceLevel: 'mild',
        isOnOffer: true,
        offerPercentage: 15,
        rating: "4.9"
      },
      {
        name: "Wireless Headphones Pro",
        slug: "wireless-headphones-pro",
        description: "Premium noise-cancelling wireless headphones with 30hr battery",
        price: "12999",
        originalPrice: "15999",
        storeId: 1,
        categoryId: 1,
        stock: 20,
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=300&fit=crop&auto=format",
          "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=300&fit=crop&auto=format"
        ],
        isOnOffer: true,
        offerPercentage: 19,
        productType: 'product',
        isFastSell: true,
        rating: "4.5"
      }
    ];

    // Insert the products
    for (const product of multiImageProducts) {
      await db.insert(products).values(product);
      console.log(`✅ Added ${product.name} with ${product.images.length} images`);
    }

    console.log(`✅ Successfully added ${multiImageProducts.length} multi-image products for testing`);
    
  } catch (error) {
    console.error('Error adding multi-image products:', error);
    process.exit(1);
  }
}

addMultiImageProducts().then(() => {
  console.log('Multi-image products setup complete!');
  process.exit(0);
}).catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});