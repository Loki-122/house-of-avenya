-- House of Avenya — Seed data for initial catalogue
-- Created: 2026-10-05
-- This migration seeds the 9 sample products from the frontend catalogue

-- Insert categories first
INSERT INTO categories (name, slug, description, display_order) VALUES
('Silk Sarees', 'silk-sarees', 'Traditional and contemporary silk sarees', 1),
('Kurta Sets', 'kurta-sets', 'Coordinated kurta and trouser sets', 2),
('Contemporary Fusion', 'contemporary-fusion', 'Modern Indian fusion wear', 3),
('Jackets', 'jackets', 'Structured and unstructured jackets', 4),
('Lehengas', 'lehengas', 'Bridal and festive lehengas', 5),
('Kurtas', 'kurtas', 'Standalone kurtas', 6),
('Dupattas', 'dupattas', 'Banarasi and silk dupattas', 7)
ON CONFLICT (slug) DO NOTHING;

-- Helper: get category IDs
DO $$
DECLARE
  cat_silk_sarees UUID;
  cat_kurta_sets UUID;
  cat_fusion UUID;
  cat_jackets UUID;
  cat_lehengas UUID;
  cat_kurtas UUID;
  cat_dupattas UUID;
BEGIN
  SELECT id INTO cat_silk_sarees FROM categories WHERE slug = 'silk-sarees';
  SELECT id INTO cat_kurta_sets FROM categories WHERE slug = 'kurta-sets';
  SELECT id INTO cat_fusion FROM categories WHERE slug = 'contemporary-fusion';
  SELECT id INTO cat_jackets FROM categories WHERE slug = 'jackets';
  SELECT id INTO cat_lehengas FROM categories WHERE slug = 'lehengas';
  SELECT id INTO cat_kurtas FROM categories WHERE slug = 'kurtas';
  SELECT id INTO cat_dupattas FROM categories WHERE slug = 'dupattas';

  -- Product 1: Aarvi Silk Saree
  INSERT INTO products (id, slug, name, category_id, description, price, compare_at_price, material, is_featured, is_new)
  VALUES (
    uuid_generate_v4(), 'aarvi-silk-saree', 'Aarvi Silk Saree', cat_silk_sarees,
    'A Kanchipuram silk saree woven on a pit loom and finished with a broad antique-gold zari border. The pallu carries a traditional kumbam motif worked in zari, and the body is left unlined so it falls in the heavy, deliberate drape the weave is known for. Worn with a hand-rolled organza blouse in the colour of your choosing.',
    18900, 22500,
    '100% Mulberry Kanchipuram silk with antique-gold zari',
    TRUE, TRUE
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 2: Meher Embroidered Kurta Set
  INSERT INTO products (id, slug, name, category_id, description, price, compare_at_price, material, is_featured, is_new)
  VALUES (
    uuid_generate_v4(), 'meher-embroidered-kurta-set', 'Meher Embroidered Kurta Set', cat_kurta_sets,
    'A straight-cut kurta in terracotta mul cotton with a matching tapered trouser, worked with tonal resham thread across the yoke and cuffs. The handwork is picked rather than machine-embroidered, so the density shifts slightly across the panel — the mark of a piece made by one pair of hands.',
    12500, NULL,
    'Mul cotton with resham thread handwork',
    TRUE, TRUE
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 3: Ira Draped Co-ord
  INSERT INTO products (id, slug, name, category_id, description, price, compare_at_price, material, is_featured, is_new)
  VALUES (
    uuid_generate_v4(), 'ira-draped-co-ord', 'Ira Draped Co-ord', cat_fusion,
    'The everyday fusion piece: a fluid wrap top cut on the bias and a wide drawstring trouser, both in a washed ivory viscose that holds its drape without clinging. Designed to be styled open over a kurta or worn alone as a complete silhouette.',
    9800, NULL,
    'Washed viscose blend with a cotton drawstring',
    FALSE, TRUE
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 4: Zara Banarasi Jacket
  INSERT INTO products (id, slug, name, category_id, description, price, compare_at_price, material, is_featured, is_new)
  VALUES (
    uuid_generate_v4(), 'zara-banarasi-jacket', 'Zara Banarasi Jacket', cat_jackets,
    'A structured brocade jacket in gold-toned Banarasi silk, cut long through the hip with a mandarin collar and a concealed placket. Woven with a jaali ground so the whole surface shifts as it catches the light, and lined in ivory habotai so it sits cleanly over a saree or kurta.',
    14200, 16900,
    'Banarasi silk brocade with ivory habotai lining',
    TRUE, TRUE
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 5: Rhea Embroidered Lehenga
  INSERT INTO products (id, slug, name, category_id, description, price, compare_at_price, material, is_featured, is_new)
  VALUES (
    uuid_generate_v4(), 'rhea-embroidered-lehenga', 'Rhea Embroidered Lehenga', cat_lehengas,
    'A bridal lehenga set in deep maroon raw silk with an antique-gold zardozi border, worked by hand across the ghera in a running jaali pattern. The skirt is cut with generous panel volume so it holds its shape through a full evening, and comes with a matching blouse and an organza dupatta with a scalloped edge.',
    34000, 42000,
    'Raw silk with hand zardozi, ivory silk organza dupatta',
    TRUE, TRUE
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 6: Kaveri Organza Saree
  INSERT INTO products (id, slug, name, category_id, description, price, compare_at_price, material, is_featured, is_new)
  VALUES (
    uuid_generate_v4(), 'kaveri-organza-saree', 'Kaveri Organza Saree', cat_silk_sarees,
    'A featherweight organza saree in bottle green, printed with a soft block-derived floral and finished with a narrow antique-gold tissue border. It weighs almost nothing, which makes it the saree to reach for in an Ahmedabad summer — the drape stays soft and it packs flat.',
    16400, NULL,
    'Silk organza with antique-gold tissue border',
    FALSE, TRUE
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 7: Naina Zardozi Kurta
  INSERT INTO products (id, slug, name, category_id, description, price, compare_at_price, material, is_featured, is_new)
  VALUES (
    uuid_generate_v4(), 'naina-zardozi-kurta', 'Naina Zardozi Kurta', cat_kurtas,
    'An everyday kurta in saffron handloom cotton, cut slightly longer and fuller than a classic straight kurta, with antique-gold zardozi worked only at the neckline. Everything else is left quiet — the point is a piece you can reach for without thinking about it.',
    8950, NULL,
    'Handloom cotton with antique-gold zardozi at the neckline',
    FALSE, FALSE
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 8: Tara Banarasi Dupatta
  INSERT INTO products (id, slug, name, category_id, description, price, compare_at_price, material, is_featured, is_new)
  VALUES (
    uuid_generate_v4(), 'tara-banarasi-dupatta', 'Tara Banarasi Dupatta', cat_dupattas,
    'A sheer Banarasi dupatta in antique gold, woven with a small buti scattered across the field and a richly worked kalga border on all four sides. Light enough to drape over a heavy lehenga without weighing it down, substantial enough to carry an ensemble on its own.',
    6400, NULL,
    'Sheer Banarasi silk organza with woven zari border',
    FALSE, FALSE
  ) ON CONFLICT (slug) DO NOTHING;

  -- Product 9: Ayaan Handloom Jacket
  INSERT INTO products (id, slug, name, category_id, description, price, compare_at_price, material, is_featured, is_new)
  VALUES (
    uuid_generate_v4(), 'ayaan-handloom-cotton-jacket', 'Ayaan Handloom Jacket', cat_jackets,
    'An unlined jacket in indigo handloom cotton, cut boxy and cropped so it sits cleanly over a kurta or a plain sari blouse. Slubbed by the loom rather than by a mill, so no two lengths are exactly alike. This edition is in its final run.',
    11200, NULL,
    'Handloom cotton, unlined',
    FALSE, FALSE
  ) ON CONFLICT (slug) DO NOTHING;
END $$;

-- Seed product images, colors, sizes, variants, details, care
DO $$
DECLARE
  p_aarvi UUID;
  p_meher UUID;
  p_ira UUID;
  p_zara UUID;
  p_rhea UUID;
  p_kaveri UUID;
  p_naina UUID;
  p_tara UUID;
  p_ayaan UUID;
BEGIN
  SELECT id INTO p_aarvi FROM products WHERE slug = 'aarvi-silk-saree';
  SELECT id INTO p_meher FROM products WHERE slug = 'meher-embroidered-kurta-set';
  SELECT id INTO p_ira FROM products WHERE slug = 'ira-draped-co-ord';
  SELECT id INTO p_zara FROM products WHERE slug = 'zara-banarasi-jacket';
  SELECT id INTO p_rhea FROM products WHERE slug = 'rhea-embroidered-lehenga';
  SELECT id INTO p_kaveri FROM products WHERE slug = 'kaveri-organza-saree';
  SELECT id INTO p_naina FROM products WHERE slug = 'naina-zardozi-kurta';
  SELECT id INTO p_tara FROM products WHERE slug = 'tara-banarasi-dupatta';
  SELECT id INTO p_ayaan FROM products WHERE slug = 'ayaan-handloom-cotton-jacket';

  -- ===== PRODUCT IMAGES =====
  -- Aarvi Silk Saree (uses product-01, product-02, product-03)
  INSERT INTO product_images (product_id, src, alt, display_order) VALUES
  (p_aarvi, '/products/product-01.jpeg', 'Aarvi Silk Saree', 0),
  (p_aarvi, '/products/product-02.jpeg', 'Meher Embroidered Kurta Set', 1),
  (p_aarvi, '/products/product-03.jpeg', 'Ira Draped Co-ord', 2);

  -- Meher Embroidered Kurta Set (uses product-02, product-03, product-04)
  INSERT INTO product_images (product_id, src, alt, display_order) VALUES
  (p_meher, '/products/product-02.jpeg', 'Meher Embroidered Kurta Set', 0),
  (p_meher, '/products/product-03.jpeg', 'Ira Draped Co-ord', 1),
  (p_meher, '/products/product-04.jpeg', 'Zara Banarasi Jacket', 2);

  -- Ira Draped Co-ord (uses product-03, product-04, product-05)
  INSERT INTO product_images (product_id, src, alt, display_order) VALUES
  (p_ira, '/products/product-03.jpeg', 'Ira Draped Co-ord', 0),
  (p_ira, '/products/product-04.jpeg', 'Zara Banarasi Jacket', 1),
  (p_ira, '/products/product-05.jpeg', 'Rhea Embroidered Lehenga', 2);

  -- Zara Banarasi Jacket (uses product-04, product-05, product-06)
  INSERT INTO product_images (product_id, src, alt, display_order) VALUES
  (p_zara, '/products/product-04.jpeg', 'Zara Banarasi Jacket', 0),
  (p_zara, '/products/product-05.jpeg', 'Rhea Embroidered Lehenga', 1),
  (p_zara, '/products/product-06.jpeg', 'Kaveri Organza Saree', 2);

  -- Rhea Embroidered Lehenga (uses product-05, product-06, product-07)
  INSERT INTO product_images (product_id, src, alt, display_order) VALUES
  (p_rhea, '/products/product-05.jpeg', 'Rhea Embroidered Lehenga', 0),
  (p_rhea, '/products/product-06.jpeg', 'Kaveri Organza Saree', 1),
  (p_rhea, '/products/product-07.jpeg', 'Naina Zardozi Kurta', 2);

  -- Kaveri Organza Saree (uses product-06, product-07, product-08)
  INSERT INTO product_images (product_id, src, alt, display_order) VALUES
  (p_kaveri, '/products/product-06.jpeg', 'Kaveri Organza Saree', 0),
  (p_kaveri, '/products/product-07.jpeg', 'Naina Zardozi Kurta', 1),
  (p_kaveri, '/products/product-08.jpeg', 'Tara Banarasi Dupatta', 2);

  -- Naina Zardozi Kurta (uses product-07, product-08, product-01)
  INSERT INTO product_images (product_id, src, alt, display_order) VALUES
  (p_naina, '/products/product-07.jpeg', 'Naina Zardozi Kurta', 0),
  (p_naina, '/products/product-08.jpeg', 'Tara Banarasi Dupatta', 1),
  (p_naina, '/products/product-01.jpeg', 'Aarvi Silk Saree', 2);

  -- Tara Banarasi Dupatta (uses product-08, product-01, product-02)
  INSERT INTO product_images (product_id, src, alt, display_order) VALUES
  (p_tara, '/products/product-08.jpeg', 'Tara Banarasi Dupatta', 0),
  (p_tara, '/products/product-01.jpeg', 'Aarvi Silk Saree', 1),
  (p_tara, '/products/product-02.jpeg', 'Meher Embroidered Kurta Set', 2);

  -- Ayaan Handloom Jacket (uses external images)
  INSERT INTO product_images (product_id, src, alt, display_order) VALUES
  (p_ayaan, 'https://images.pexels.com/photos/28382914/pexels-photo-28382914.jpeg?auto=compress&cs=tinysrgb&w=1400', 'A skilled artisan weaving fabric on a traditional handloom', 0),
  (p_ayaan, 'https://images.pexels.com/photos/28382914/pexels-photo-28382914.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1500', 'Slubbed handloom cotton in the weave', 1),
  (p_ayaan, 'https://images.pexels.com/photos/12725952/pexels-photo-12725952.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Full-length view of a woman in a flowing traditional Indian ensemble indoors', 2);

  -- ===== PRODUCT COLORS =====
  -- Aarvi: Maroon, Emerald, Gold
  INSERT INTO product_colors (product_id, name, hex, display_order) VALUES
  (p_aarvi, 'Maroon', '#6b1d2d', 0),
  (p_aarvi, 'Emerald', '#2f5d50', 1),
  (p_aarvi, 'Antique Gold', '#c9a86b', 2);

  -- Meher: Terracotta, Ivory, Espresso
  INSERT INTO product_colors (product_id, name, hex, display_order) VALUES
  (p_meher, 'Terracotta', '#c45d3b', 0),
  (p_meher, 'Ivory', '#f5efe3', 1),
  (p_meher, 'Espresso', '#2d1b15', 2);

  -- Ira: Ivory, Espresso, Desert Sand
  INSERT INTO product_colors (product_id, name, hex, display_order) VALUES
  (p_ira, 'Ivory', '#f5efe3', 0),
  (p_ira, 'Espresso', '#2d1b15', 1),
  (p_ira, 'Desert Sand', '#d8c3a5', 2);

  -- Zara: Gold, Espresso, Maroon
  INSERT INTO product_colors (product_id, name, hex, display_order) VALUES
  (p_zara, 'Antique Gold', '#c9a86b', 0),
  (p_zara, 'Espresso', '#2d1b15', 1),
  (p_zara, 'Maroon', '#6b1d2d', 2);

  -- Rhea: Maroon, Bottle Green, Gold
  INSERT INTO product_colors (product_id, name, hex, display_order) VALUES
  (p_rhea, 'Maroon', '#6b1d2d', 0),
  (p_rhea, 'Bottle Green', '#1f3d2b', 1),
  (p_rhea, 'Antique Gold', '#c9a86b', 2);

  -- Kaveri: Bottle Green, Antique Rose, Midnight Indigo
  INSERT INTO product_colors (product_id, name, hex, display_order) VALUES
  (p_kaveri, 'Bottle Green', '#1f3d2b', 0),
  (p_kaveri, 'Antique Rose', '#c98f7a', 1),
  (p_kaveri, 'Midnight Indigo', '#2b3a67', 2);

  -- Naina: Saffron only
  INSERT INTO product_colors (product_id, name, hex, display_order) VALUES
  (p_naina, 'Saffron', '#e0a458', 0);

  -- Tara: Gold, Antique Rose, Onyx
  INSERT INTO product_colors (product_id, name, hex, display_order) VALUES
  (p_tara, 'Antique Gold', '#c9a86b', 0),
  (p_tara, 'Antique Rose', '#c98f7a', 1),
  (p_tara, 'Onyx', '#1a1a1a', 2);

  -- Ayaan: Midnight Indigo, Onyx, Desert Sand
  INSERT INTO product_colors (product_id, name, hex, display_order) VALUES
  (p_ayaan, 'Midnight Indigo', '#2b3a67', 0),
  (p_ayaan, 'Onyx', '#1a1a1a', 1),
  (p_ayaan, 'Desert Sand', '#d8c3a5', 2);

  -- ===== PRODUCT SIZES =====
  -- Apparel sizes: XS, S, M, L, XL, XXL
  INSERT INTO product_sizes (product_id, name, display_order) VALUES
  (p_meher, 'XS', 0), (p_meher, 'S', 1), (p_meher, 'M', 2), (p_meher, 'L', 3), (p_meher, 'XL', 4), (p_meher, 'XXL', 5),
  (p_ira, 'XS', 0), (p_ira, 'S', 1), (p_ira, 'M', 2), (p_ira, 'L', 3), (p_ira, 'XL', 4), (p_ira, 'XXL', 5),
  (p_zara, 'XS', 0), (p_zara, 'S', 1), (p_zara, 'M', 2), (p_zara, 'L', 3), (p_zara, 'XL', 4), (p_zara, 'XXL', 5),
  (p_rhea, 'XS', 0), (p_rhea, 'S', 1), (p_rhea, 'M', 2), (p_rhea, 'L', 3), (p_rhea, 'XL', 4),
  (p_naina, 'XS', 0), (p_naina, 'S', 1), (p_naina, 'M', 2), (p_naina, 'L', 3), (p_naina, 'XL', 4),
  (p_ayaan, 'XS', 0), (p_ayaan, 'S', 1), (p_ayaan, 'M', 2), (p_ayaan, 'L', 3), (p_ayaan, 'XL', 4);

  -- Free Size for unstitched pieces
  INSERT INTO product_sizes (product_id, name, display_order) VALUES
  (p_aarvi, 'Free Size', 0),
  (p_kaveri, 'Free Size', 0),
  (p_tara, 'Free Size', 0);

  -- ===== PRODUCT VARIANTS (inventory) =====
  -- Aarvi Silk Saree: 3 colors, Free Size, stock 12 total (4 each)
  INSERT INTO product_variants (product_id, size_id, color_id, stock, sku)
  SELECT p_aarvi, s.id, c.id, 4, 'AVN-1001-' || c.name || '-FREE'
  FROM product_sizes s, product_colors c
  WHERE s.product_id = p_aarvi AND c.product_id = p_aarvi;

  -- Meher: 3 colors x 6 sizes = 18 variants, stock 18 total (1 each)
  INSERT INTO product_variants (product_id, size_id, color_id, stock, sku)
  SELECT p_meher, s.id, c.id, 1, 'AVN-1002-' || c.name || '-' || s.name
  FROM product_sizes s, product_colors c
  WHERE s.product_id = p_meher AND c.product_id = p_meher;

  -- Ira: 3 colors x 6 sizes = 18 variants, stock 24 total (1-2 each)
  INSERT INTO product_variants (product_id, size_id, color_id, stock, sku)
  SELECT p_ira, s.id, c.id, CASE WHEN s.name IN ('S','M','L') THEN 2 ELSE 1 END, 'AVN-1003-' || c.name || '-' || s.name
  FROM product_sizes s, product_colors c
  WHERE s.product_id = p_ira AND c.product_id = p_ira;

  -- Zara: 3 colors x 6 sizes = 18 variants, stock 7 total
  INSERT INTO product_variants (product_id, size_id, color_id, stock, sku)
  SELECT p_zara, s.id, c.id, CASE WHEN s.name IN ('M','L') AND c.name = 'Antique Gold' THEN 2 ELSE 0 END, 'AVN-1004-' || c.name || '-' || s.name
  FROM product_sizes s, product_colors c
  WHERE s.product_id = p_zara AND c.product_id = p_zara;

  -- Rhea: 3 colors x 5 sizes = 15 variants, stock 4 total
  INSERT INTO product_variants (product_id, size_id, color_id, stock, sku)
  SELECT p_rhea, s.id, c.id, CASE WHEN s.name IN ('S','M') AND c.name = 'Maroon' THEN 2 ELSE 0 END, 'AVN-1005-' || c.name || '-' || s.name
  FROM product_sizes s, product_colors c
  WHERE s.product_id = p_rhea AND c.product_id = p_rhea;

  -- Kaveri: 3 colors x Free Size = 3 variants, stock 15 total (5 each)
  INSERT INTO product_variants (product_id, size_id, color_id, stock, sku)
  SELECT p_kaveri, s.id, c.id, 5, 'AVN-1006-' || c.name || '-FREE'
  FROM product_sizes s, product_colors c
  WHERE s.product_id = p_kaveri AND c.product_id = p_kaveri;

  -- Naina: 1 color x 5 sizes = 5 variants, stock 3 total
  INSERT INTO product_variants (product_id, size_id, color_id, stock, sku)
  SELECT p_naina, s.id, c.id, CASE WHEN s.name IN ('S','M') THEN 1 ELSE 0 END, 'AVN-1007-' || c.name || '-' || s.name
  FROM product_sizes s, product_colors c
  WHERE s.product_id = p_naina AND c.product_id = p_naina;

  -- Tara: 3 colors x Free Size = 3 variants, stock 0 (sold out)
  INSERT INTO product_variants (product_id, size_id, color_id, stock, sku)
  SELECT p_tara, s.id, c.id, 0, 'AVN-1008-' || c.name || '-FREE'
  FROM product_sizes s, product_colors c
  WHERE s.product_id = p_tara AND c.product_id = p_tara;

  -- Ayaan: 3 colors x 5 sizes = 15 variants, stock 2 total
  INSERT INTO product_variants (product_id, size_id, color_id, stock, sku)
  SELECT p_ayaan, s.id, c.id, CASE WHEN s.name = 'M' AND c.name = 'Midnight Indigo' THEN 2 ELSE 0 END, 'AVN-1009-' || c.name || '-' || s.name
  FROM product_sizes s, product_colors c
  WHERE s.product_id = p_ayaan AND c.product_id = p_ayaan;

  -- ===== PRODUCT DETAILS =====
  INSERT INTO product_details (product_id, label, value, display_order) VALUES
  (p_aarvi, 'Saree Length', '5.5 metres, including 0.8 metre unstitched blouse fabric', 0),
  (p_aarvi, 'Weave', 'Pit loom, double warp Kanchipuram weave', 1),
  (p_aarvi, 'Border', '2.5 inch antique-gold zari, kumbam pallu', 2),
  (p_aarvi, 'Occasion', 'Wedding, festival, evening', 3),
  (p_aarvi, 'Made In', 'Kanchipuram, Tamil Nadu', 4);

  INSERT INTO product_details (product_id, label, value, display_order) VALUES
  (p_meher, 'Kurta Length', '46 inch, straight cut with side slits', 0),
  (p_meher, 'Trouser', 'Elasticated waist with drawstring, 38 inch inseam', 1),
  (p_meher, 'Handwork', 'Tonal resham thread, yoke and cuffs', 2),
  (p_meher, 'Occasion', 'Festive, office-to-evening', 3),
  (p_meher, 'Made In', 'Jaipur, Rajasthan', 4);

  INSERT INTO product_details (product_id, label, value, display_order) VALUES
  (p_ira, 'Top Length', '42 inch on a size S, bias cut', 0),
  (p_ira, 'Trouser', 'Wide leg, elasticated back waist with front drawstring', 1),
  (p_ira, 'Fit', 'Relaxed and fluid through the body', 2),
  (p_ira, 'Occasion', 'Everyday, travel, resort', 3),
  (p_ira, 'Made In', 'Bengaluru, Karnataka', 4);

  INSERT INTO product_details (product_id, label, value, display_order) VALUES
  (p_zara, 'Length', '28 inch from shoulder, hip length', 0),
  (p_zara, 'Closure', 'Mandarin collar with concealed placket and inner ties', 1),
  (p_zara, 'Weave', 'Banarasi brocade, jaali ground', 2),
  (p_zara, 'Occasion', 'Reception, evening, festive', 3),
  (p_zara, 'Made In', 'Varanasi, Uttar Pradesh', 4);

  INSERT INTO product_details (product_id, label, value, display_order) VALUES
  (p_rhea, 'Skirt Length', '42 inch ghera, 14 inch panel flare', 0),
  (p_rhea, 'Handwork', 'Antique-gold zardozi, running jaali, ghera and blouse', 1),
  (p_rhea, 'Includes', 'Lehenga skirt, blouse, organza dupatta', 2),
  (p_rhea, 'Occasion', 'Bridal, reception, sangeet', 3),
  (p_rhea, 'Made In', 'Delhi, NCR', 4);

  INSERT INTO product_details (product_id, label, value, display_order) VALUES
  (p_kaveri, 'Saree Length', '5.5 metres, including 0.8 metre unstitched blouse fabric', 0),
  (p_kaveri, 'Weave', 'Printed silk organza', 1),
  (p_kaveri, 'Border', 'Narrow antique-gold tissue edge', 2),
  (p_kaveri, 'Occasion', 'Daytime, summer, daytime receptions', 3),
  (p_kaveri, 'Made In', 'Surat, Gujarat', 4);

  INSERT INTO product_details (product_id, label, value, display_order) VALUES
  (p_naina, 'Length', '44 inch, side slits', 0),
  (p_naina, 'Handwork', 'Antique-gold zardozi at the neckline only', 1),
  (p_naina, 'Fabric', 'Handloom cotton, 80 count', 2),
  (p_naina, 'Occasion', 'Everyday, daytime, casual festive', 3),
  (p_naina, 'Made In', 'Chanderi, Madhya Pradesh', 4);

  INSERT INTO product_details (product_id, label, value, display_order) VALUES
  (p_tara, 'Dimensions', '2.4 metres x 1.1 metre', 0),
  (p_tara, 'Weave', 'Banarasi, kadhwa buti, kalga border', 1),
  (p_tara, 'Border', 'Worked on all four sides', 2),
  (p_tara, 'Occasion', 'Bridal, festive, ceremony', 3),
  (p_tara, 'Made In', 'Varanasi, Uttar Pradesh', 4);

  INSERT INTO product_details (product_id, label, value, display_order) VALUES
  (p_ayaan, 'Length', '22 inch from shoulder, cropped', 0),
  (p_ayaan, 'Fit', 'Boxy, cut to sit over a kurta', 1),
  (p_ayaan, 'Fabric', 'Slubbed handloom cotton, naturally dyed indigo', 2),
  (p_ayaan, 'Occasion', 'Everyday, travel, casual', 3),
  (p_ayaan, 'Made In', 'Kachchh, Gujarat', 4);

  -- ===== PRODUCT CARE =====
  INSERT INTO product_care (product_id, instruction, display_order) VALUES
  (p_aarvi, 'Dry clean only — specialist silk cleaner recommended', 0),
  (p_aarvi, 'Store wrapped in muslin, away from direct sunlight', 1),
  (p_aarvi, 'Refold along a different line each time to avoid permanent creasing', 2);

  INSERT INTO product_care (product_id, instruction, display_order) VALUES
  (p_meher, 'Gentle machine wash cold, separately for the first wash', 0),
  (p_meher, 'Do not bleach — the handwork is tonal and will lift', 1),
  (p_meher, 'Warm iron on reverse, or steam lightly from the right side', 2);

  INSERT INTO product_care (product_id, instruction, display_order) VALUES
  (p_ira, 'Machine wash cold on a gentle cycle', 0),
  (p_ira, 'Tumble dry low to soften the wash', 1),
  (p_ira, 'Warm iron while slightly damp for the cleanest drape', 2);

  INSERT INTO product_care (product_id, instruction, display_order) VALUES
  (p_zara, 'Dry clean only', 0),
  (p_zara, 'Hang on a padded hanger immediately after wear', 1),
  (p_zara, 'Store in the breathable cotton garment bag provided', 2);

  INSERT INTO product_care (product_id, instruction, display_order) VALUES
  (p_rhea, 'Dry clean only — specialist embellishment cleaner', 0),
  (p_rhea, 'Never fold directly on the embellished border', 1),
  (p_rhea, 'Store in the muslin garment bag, refolded monthly', 2);

  INSERT INTO product_care (product_id, instruction, display_order) VALUES
  (p_kaveri, 'Dry clean only', 0),
  (p_kaveri, 'Keep away from perfume and deodorant to protect the organza', 1),
  (p_kaveri, 'Store on a padded hanger between muslin sheets', 2);

  INSERT INTO product_care (product_id, instruction, display_order) VALUES
  (p_naina, 'Hand wash separately in cold water for the first wash', 0),
  (p_naina, 'Dry in shade to protect the zardozi', 1),
  (p_naina, 'Iron on reverse with a cloth between the embellishment and the iron', 2);

  INSERT INTO product_care (product_id, instruction, display_order) VALUES
  (p_tara, 'Dry clean only', 0),
  (p_tara, 'Fold loosely rather than pressing the zari border flat', 1),
  (p_tara, 'Store away from direct light to keep the gold from tarnishing', 2);

  INSERT INTO product_care (product_id, instruction, display_order) VALUES
  (p_ayaan, 'Machine wash cold, inside out', 0),
  (p_ayaan, 'Line dry in shade — the indigo will lighten in direct sun', 1),
  (p_ayaan, 'Warm iron; the unlined body presses easily', 2);
END $$;



