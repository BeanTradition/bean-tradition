INSERT INTO public.products (name, description, image, category, roast, intensity, "tastingNotes", "bestFor", "countInStock", "numReviews", tags, variants)
VALUES
(
  'Robusta Coffee Beans', 
  'Indulge in the bold and robust flavor of our Robusta blends, perfect for those who prefer a stronger coffee experience.', 
  'https://coffeeaffection.com/wp-content/uploads/2023/03/robusta-coffee-beans_Andre_K_Shutterstock.jpg',
  'Beans',
  'Dark',
  5,
  'Dark Chocolate & Spice',
  'Espresso & Cold Brew',
  100,
  12,
  ARRAY['Bold', 'Robust', 'Strong Experience'],
  '[{"weight": "250gm", "price": 399}]'::jsonb
),
(
  'Arabica Coffee Beans', 
  'Experience the delicate floral notes and subtle sweetness of our premium Arabica beans.',
  'https://www.foodandwine.com/thmb/XbKXqQvF61Csj9XLs_Nj3xwlwEI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Everything-You-Need-To-Know-About-Arabica-Coffee-FT-BLOG0822-2000-127d1551916e45138ea373de75f08138.jpg',
  'Beans',
  'Medium',
  3,
  'Caramel & Berries',
  'Pour Over & AeroPress',
  150,
  8,
  ARRAY['Delicate', 'Floral', 'Subtle Sweetness'],
  '[{"weight": "250gm", "price": 499}]'::jsonb
),
(
  'Filter Coffee Powder', 
  'Our freshly ground filter coffee powder is perfect for brewing the classic South Indian filter coffee, known for its rich aroma and robust flavor.',
  'https://5.imimg.com/data5/SELLER/Default/2024/5/417141409/OG/IF/RM/25958856/filter-coffee-powder-1000x1000.jpg',
  'Filter Powder',
  'Medium',
  4,
  'Bold Cocoa & Chicory',
  'South Indian Filter',
  200,
  45,
  ARRAY['Rich Aroma', 'Classic', 'Robust Flavor'],
  '[{"weight": "250gm", "price": 299}]'::jsonb
),
(
  'Instant Coffee Powder', 
  'Enjoy a quick and convenient cup of premium instant coffee, made with high-quality beans and expertly blended for a satisfying taste.',
  'https://5.imimg.com/data5/SELLER/Default/2020/12/OQ/PZ/SY/7668520/instant-coffee-powder-500x500.jpg',
  'Instant',
  'Medium',
  3,
  'Nutty & Smooth',
  'Latte & Frappe',
  300,
  20,
  ARRAY['Quick', 'Convenient', 'Expertly Blended'],
  '[{"weight": "200gm", "price": 399}]'::jsonb
);
