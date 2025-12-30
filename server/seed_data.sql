INSERT INTO public.products (name, description, image, category, roast, intensity, "tastingNotes", "bestFor", "countInStock", "numReviews", tags, variants)
VALUES
(
  'Robusta Coffee Beans', 
  'Indulge in the bold and robust flavor of our Robusta blends, perfect for those who prefer a stronger coffee experience.', 
  '/assets/robusta.jpg',
  'Beans',
  'Medium',
  5,
  'Dark Chocolate & Spice',
  'Strong Espresso & Cold Brew',
  100,
  12,
  ARRAY['Bold', 'Robust', 'Strong Experience'],
  '[{"weight": "250gm", "price": 499}]'::jsonb
),
(
  'Arabica Coffee Beans', 
  'Experience the delicate floral notes and subtle sweetness of our premium Arabica beans.',
  '/assets/arabica.jpg',
  'Beans',
  'Medium',
  3,
  'Caramel & Berries',
  'Pour Over, French Press & Black Coffee',
  150,
  8,
  ARRAY['Delicate', 'Floral', 'Subtle Sweetness'],
  '[{"weight": "250gm", "price": 599}]'::jsonb
),
(
  'Filter Coffee Powder', 
  'Our freshly ground filter coffee powder is perfect for brewing the classic South Indian filter coffee, known for its rich aroma and robust flavor.',
  '/assets/filter_coffee.jpg',
  'Filter Powder',
  'Medium',
  4,
  'Bold Cocoa & Chicory',
  'Traditional South Indian Filter',
  200,
  45,
  ARRAY['Rich Aroma', 'Classic', 'Robust Flavor'],
  '[{"weight": "250gm", "price": 399}]'::jsonb
),
(
  'Instant Coffee Powder', 
  'Enjoy a quick and convenient cup of premium instant coffee, made with high-quality beans and expertly blended for a satisfying taste.',
  '/assets/instant_coffee.jpg',
  'Instant',
  'Medium',
  3,
  'Nutty & Smooth',
  'Traveling & Quick Hot/Cold Coffee',
  300,
  20,
  ARRAY['Quick', 'Convenient', 'Expertly Blended'],
  '[{"weight": "200gm", "price": 499}]'::jsonb
);
