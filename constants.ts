
import { Product } from './types';

export const USP_DATA = [
  {
    title: "AA-Grade Perfection",
    description: "We strictly select only AA-grade beans, ensuring every bean is uniform in size. We guarantee zero broken or crushed beans for a flawless flavor profile.",
    image: "/assets/aa_grade.jpg"
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
    image: "/assets/about_values_1.jpg"
  }
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: "Robusta Coffee Beans",
    description: "Indulge in the bold and robust flavor of our Robusta blends, perfect for those who prefer a stronger coffee experience.",
    image: "/assets/Robusta.jpg",
    tags: ["Bold", "Robust", "Strong Experience"],
    intensity: 5,
    roast: "Medium",
    category: "Beans",
    tastingNotes: "Dark Chocolate & Spice",
    bestFor: "Strong Espresso & Cold Brew",
    variants: [
      { weight: "250gm", price: 499 },
    ]
  },
  {
    id: '2',
    name: "Arabica Coffee Beans",
    description: "Experience the delicate floral notes and subtle sweetness of our premium Arabica beans.",
    image: "/assets/Arabica.jpg",
    tags: ["Delicate", "Floral", "Subtle Sweetness"],
    intensity: 3,
    roast: "Medium",
    category: "Beans",
    tastingNotes: "Caramel & Berries",
    bestFor: "Pour Over, French Press & Black Coffee",
    variants: [
      { weight: "250gm", price: 599 },
    ]
  },
  {
    id: '3',
    name: "Filter Coffee Powder",
    description: "Our freshly ground filter coffee powder is perfect for brewing the classic South Indian filter coffee, known for its rich aroma and robust flavor.",
    image: "/assets/Filter.jpg",
    tags: ["Rich Aroma", "Classic", "Robust Flavor"],
    intensity: 4,
    roast: "Medium",
    category: "Filter Powder",
    tastingNotes: "Bold Cocoa & Chicory",
    bestFor: "Traditional South Indian Filter",
    variants: [
      { weight: "250gm", price: 399 },
    ]
  },
  {
    id: '4',
    name: "Instant Coffee Powder",
    description: "Enjoy a quick and convenient cup of premium instant coffee, made with high-quality beans and expertly blended for a satisfying taste.",
    image: "/assets/Instant.jpg",
    tags: ["Quick", "Convenient", "Expertly Blended"],
    intensity: 3,
    roast: "Medium",
    category: "Instant",
    tastingNotes: "Nutty & Smooth",
    bestFor: "Traveling & Quick Hot/Cold Coffee",
    variants: [
      { weight: "200gm", price: 499 },
    ]
  }
];
