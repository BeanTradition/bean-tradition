
import { Product } from './types';

export const USP_DATA = [
  {
    title: "AA-Grade Perfection",
    description: "We strictly select only AA-grade beans, ensuring every bean is uniform in size. We guarantee zero broken or crushed beans for a flawless flavor profile.",
    image: "https://images.unsplash.com/photo-1552346989-e069318e20a5?q=80&w=800&auto=format&fit=crop"
  },
  /* 
  {
    title: "Several Roast Profiles",
    description: "Explore our diverse range of expertly crafted roasts. From bright, citrusy light roasts to deep, smoky dark roasts, our master roasters have perfected multiple profiles to suit every palette.",
    image: "https://images.unsplash.com/photo-1512568400610-62da28bc8a13?q=80&w=800&auto=format&fit=crop"
  },
  */
  {
    title: "Shade-Grown Heritage",
    description: "Cultivated under the canopy of ancient trees in the Western Ghats. This natural shade allows cherries to ripen slowly, locking in complex sugars for a naturally sweeter, fuller body.",
    image: "https://images.unsplash.com/photo-1524350876685-274059332603?q=80&w=800&auto=format&fit=crop"
  }
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: "Robusta Coffee Beans",
    description: "Indulge in the bold and robust flavor of our Robusta blends, perfect for those who prefer a stronger coffee experience.",
    image: "https://coffeeaffection.com/wp-content/uploads/2023/03/robusta-coffee-beans_Andre_K_Shutterstock.jpg",
    tags: ["Bold", "Robust", "Strong Experience"],
    intensity: 5,
    roast: "Dark",
    category: "Beans",
    tastingNotes: "Dark Chocolate & Spice",
    bestFor: "Espresso & Cold Brew",
    variants: [
      { weight: "250gm", price: 399 },
      /* 
         Future Variants:
         { weight: "500gm", price: 749 },
         { weight: "1kg", price: 1399 }
      */
    ]
  },
  {
    id: '2',
    name: "Arabica Coffee Beans",
    description: "Experience the delicate floral notes and subtle sweetness of our premium Arabica beans.",
    image: "https://www.foodandwine.com/thmb/XbKXqQvF61Csj9XLs_Nj3xwlwEI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Everything-You-Need-To-Know-About-Arabica-Coffee-FT-BLOG0822-2000-127d1551916e45138ea373de75f08138.jpg",
    tags: ["Delicate", "Floral", "Subtle Sweetness"],
    intensity: 3,
    roast: "Medium",
    category: "Beans",
    tastingNotes: "Caramel & Berries",
    bestFor: "Pour Over & AeroPress",
    variants: [
      { weight: "250gm", price: 499 },
      /* 
         Future Variants:
         { weight: "500gm", price: 949 },
         { weight: "1kg", price: 1799 }
      */
    ]
  },
  {
    id: '3',
    name: "Filter Coffee Powder",
    description: "Our freshly ground filter coffee powder is perfect for brewing the classic South Indian filter coffee, known for its rich aroma and robust flavor.",
    image: "https://5.imimg.com/data5/SELLER/Default/2024/5/417141409/OG/IF/RM/25958856/filter-coffee-powder-1000x1000.jpg",
    tags: ["Rich Aroma", "Classic", "Robust Flavor"],
    intensity: 4,
    roast: "Medium",
    category: "Filter Powder",
    tastingNotes: "Bold Cocoa & Chicory",
    bestFor: "South Indian Filter",
    variants: [
      { weight: "250gm", price: 299 },
      /* 
         Future Variants:
         { weight: "500gm", price: 549 },
         { weight: "1kg", price: 999 }
      */
    ]
  },
  {
    id: '4',
    name: "Instant Coffee Powder",
    description: "Enjoy a quick and convenient cup of premium instant coffee, made with high-quality beans and expertly blended for a satisfying taste.",
    image: "https://5.imimg.com/data5/SELLER/Default/2020/12/OQ/PZ/SY/7668520/instant-coffee-powder-500x500.jpg",
    tags: ["Quick", "Convenient", "Expertly Blended"],
    intensity: 3,
    roast: "Medium",
    category: "Instant",
    tastingNotes: "Nutty & Smooth",
    bestFor: "Latte & Frappe",
    variants: [
      { weight: "200gm", price: 399 },
      /* 
         Future Variants:
         { weight: "50gm", price: 120 },
         { weight: "100gm", price: 220 }
      */
    ]
  }
];
