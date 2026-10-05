/**
 * Product model and the sample House of Avenya catalogue.
 *
 * This is the single source of truth for everything the shop needs to render a
 * product. It is deliberately a plain, serialisable shape: every field here can
 * be stored in a database column or JSON document without a translation layer,
 * so replacing this file with a Supabase query later changes where the data
 * comes from and nothing else.
 */

export type ProductImage = {
  /** Root-relative for files in /public, absolute once these move to a CDN. */
  src: string;
  alt: string;
};

export type ProductColor = {
  name: string;
  /** Hex used for the selector swatch. */
  hex: string;
};

export type ProductDetail = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  /** Rupees. Never a preformatted string — see `formatPrice`. */
  price: number;
  /** Rupees. Present only when the piece is marked down. */
  compareAtPrice?: number;
  images: ProductImage[];
  /** 'Free Size' for unstitched and draped pieces, otherwise the apparel run. */
  sizes: string[];
  colors: ProductColor[];
  /** Units on hand across all sizes. 0 renders as sold out. */
  stock: number;
  material: string;
  care: string[];
  details: ProductDetail[];
  isFeatured: boolean;
  isNew: boolean;
};

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const FREE_SIZE = ['Free Size'];

/**
 * Client photography, in the order the pieces appear in the catalogue.
 *
 * The files live in /public/products and are served by Next as static assets.
 * `product-01` belongs to the first product, `product-02` to the second, and so
 * on — the only thing that maps a product to a photograph is its position here.
 */
const PRODUCT_PHOTOS = [
  '/products/product-01.jpeg',
  '/products/product-02.jpeg',
  '/products/product-03.jpeg',
  '/products/product-04.jpeg',
  '/products/product-05.jpeg',
  '/products/product-06.jpeg',
  '/products/product-07.jpeg',
  '/products/product-08.jpeg',
];

/**
 * The piece each client photograph shows, in the same order. Used for alt text
 * so a frame is always described by the garment actually visible in it.
 */
const PHOTO_OWNERS = [
  'Aarvi Silk Saree',
  'Meher Embroidered Kurta Set',
  'Ira Draped Co-ord',
  'Zara Banarasi Jacket',
  'Rhea Embroidered Lehenga',
  'Kaveri Organza Saree',
  'Naina Zardozi Kurta',
  'Tara Banarasi Dupatta',
];

/**
 * Three frames per product so the gallery has something to move between: the
 * piece's own shot first, then the next two in the set.
 */
function shots(startIndex: number): ProductImage[] {
  return [0, 1, 2].map((offset) => {
    const position = (startIndex + offset) % PRODUCT_PHOTOS.length;
    return { src: PRODUCT_PHOTOS[position], alt: PHOTO_OWNERS[position] };
  });
}

const GOLD = { name: 'Antique Gold', hex: '#c9a86b' };
const IVORY = { name: 'Ivory', hex: '#f5efe3' };
const ESPRESSO = { name: 'Espresso', hex: '#2d1b15' };
const TERRACOTTA = { name: 'Terracotta', hex: '#c45d3b' };
const MAROON = { name: 'Maroon', hex: '#6b1d2d' };
const EMERALD = { name: 'Emerald', hex: '#2f5d50' };
const INDIGO = { name: 'Midnight Indigo', hex: '#2b3a67' };
const SAFFRON = { name: 'Saffron', hex: '#e0a458' };
const SAND = { name: 'Desert Sand', hex: '#d8c3a5' };
const ROSE = { name: 'Antique Rose', hex: '#c98f7a' };
const ONYX = { name: 'Onyx', hex: '#1a1a1a' };
const BOTTLE = { name: 'Bottle Green', hex: '#1f3d2b' };

/**
 * The order of this array is the order of the catalogue. The first four are the
 * established house pieces and the homepage "New Arrivals" band renders a fixed
 * four-slot edit taken from the top of the list, so they must stay at the top.
 */
export const products: Product[] = [
  {
    id: 'avn-1001',
    slug: 'aarvi-silk-saree',
    name: 'Aarvi Silk Saree',
    category: 'Silk Sarees',
    description:
      'A Kanchipuram silk saree woven on a pit loom and finished with a broad antique-gold zari border. The pallu carries a traditional kumbam motif worked in zari, and the body is left unlined so it falls in the heavy, deliberate drape the weave is known for. Worn with a hand-rolled organza blouse in the colour of your choosing.',
    price: 18900,
    compareAtPrice: 22500,
    images: shots(0),
    sizes: FREE_SIZE,
    colors: [MAROON, EMERALD, GOLD],
    stock: 12,
    material: '100% Mulberry Kanchipuram silk with antique-gold zari',
    care: [
      'Dry clean only — specialist silk cleaner recommended',
      'Store wrapped in muslin, away from direct sunlight',
      'Refold along a different line each time to avoid permanent creasing',
    ],
    details: [
      { label: 'Saree Length', value: '5.5 metres, including 0.8 metre unstitched blouse fabric' },
      { label: 'Weave', value: 'Pit loom, double warp Kanchipuram weave' },
      { label: 'Border', value: '2.5 inch antique-gold zari, kumbam pallu' },
      { label: 'Occasion', value: 'Wedding, festival, evening' },
      { label: 'Made In', value: 'Kanchipuram, Tamil Nadu' },
    ],
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'avn-1002',
    slug: 'meher-embroidered-kurta-set',
    name: 'Meher Embroidered Kurta Set',
    category: 'Kurta Sets',
    description:
      'A straight-cut kurta in terracotta mul cotton with a matching tapered trouser, worked with tonal resham thread across the yoke and cuffs. The handwork is picked rather than machine-embroidered, so the density shifts slightly across the panel — the mark of a piece made by one pair of hands.',
    price: 12500,
    images: shots(1),
    sizes: APPAREL_SIZES,
    colors: [TERRACOTTA, IVORY, ESPRESSO],
    stock: 18,
    material: 'Mul cotton with resham thread handwork',
    care: [
      'Gentle machine wash cold, separately for the first wash',
      'Do not bleach — the handwork is tonal and will lift',
      'Warm iron on reverse, or steam lightly from the right side',
    ],
    details: [
      { label: 'Kurta Length', value: '46 inch, straight cut with side slits' },
      { label: 'Trouser', value: 'Elasticated waist with drawstring, 38 inch inseam' },
      { label: 'Handwork', value: 'Tonal resham thread, yoke and cuffs' },
      { label: 'Occasion', value: 'Festive, office-to-evening' },
      { label: 'Made In', value: 'Jaipur, Rajasthan' },
    ],
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'avn-1003',
    slug: 'ira-draped-co-ord',
    name: 'Ira Draped Co-ord',
    category: 'Contemporary Fusion',
    description:
      'The everyday fusion piece: a fluid wrap top cut on the bias and a wide drawstring trouser, both in a washed ivory viscose that holds its drape without clinging. Designed to be styled open over a kurta or worn alone as a complete silhouette.',
    price: 9800,
    images: shots(2),
    sizes: APPAREL_SIZES,
    colors: [IVORY, ESPRESSO, SAND],
    stock: 24,
    material: 'Washed viscose blend with a cotton drawstring',
    care: [
      'Machine wash cold on a gentle cycle',
      'Tumble dry low to soften the wash',
      'Warm iron while slightly damp for the cleanest drape',
    ],
    details: [
      { label: 'Top Length', value: '42 inch on a size S, bias cut' },
      { label: 'Trouser', value: 'Wide leg, elasticated back waist with front drawstring' },
      { label: 'Fit', value: 'Relaxed and fluid through the body' },
      { label: 'Occasion', value: 'Everyday, travel, resort' },
      { label: 'Made In', value: 'Bengaluru, Karnataka' },
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: 'avn-1004',
    slug: 'zara-banarasi-jacket',
    name: 'Zara Banarasi Jacket',
    category: 'Jackets',
    description:
      'A structured brocade jacket in gold-toned Banarasi silk, cut long through the hip with a mandarin collar and a concealed placket. Woven with a jaali ground so the whole surface shifts as it catches the light, and lined in ivory habotai so it sits cleanly over a saree or kurta.',
    price: 14200,
    compareAtPrice: 16900,
    images: shots(3),
    sizes: APPAREL_SIZES,
    colors: [GOLD, ESPRESSO, MAROON],
    stock: 7,
    material: 'Banarasi silk brocade with ivory habotai lining',
    care: [
      'Dry clean only',
      'Hang on a padded hanger immediately after wear',
      'Store in the breathable cotton garment bag provided',
    ],
    details: [
      { label: 'Length', value: '28 inch from shoulder, hip length' },
      { label: 'Closure', value: 'Mandarin collar with concealed placket and inner ties' },
      { label: 'Weave', value: 'Banarasi brocade, jaali ground' },
      { label: 'Occasion', value: 'Reception, evening, festive' },
      { label: 'Made In', value: 'Varanasi, Uttar Pradesh' },
    ],
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'avn-1005',
    slug: 'rhea-embroidered-lehenga',
    name: 'Rhea Embroidered Lehenga',
    category: 'Lehengas',
    description:
      'A bridal lehenga set in deep maroon raw silk with an antique-gold zardozi border, worked by hand across the ghera in a running jaali pattern. The skirt is cut with generous panel volume so it holds its shape through a full evening, and comes with a matching blouse and an organza dupatta with a scalloped edge.',
    price: 34000,
    compareAtPrice: 42000,
    images: shots(4),
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [MAROON, BOTTLE, GOLD],
    stock: 4,
    material: 'Raw silk with hand zardozi, ivory silk organza dupatta',
    care: [
      'Dry clean only — specialist embellishment cleaner',
      'Never fold directly on the embellished border',
      'Store in the muslin garment bag, refolded monthly',
    ],
    details: [
      { label: 'Skirt Length', value: '42 inch ghera, 14 inch panel flare' },
      { label: 'Handwork', value: 'Antique-gold zardozi, running jaali, ghera and blouse' },
      { label: 'Includes', value: 'Lehenga skirt, blouse, organza dupatta' },
      { label: 'Occasion', value: 'Bridal, reception, sangeet' },
      { label: 'Made In', value: 'Delhi, NCR' },
    ],
    isFeatured: true,
    isNew: true,
  },
  {
    id: 'avn-1006',
    slug: 'kaveri-organza-saree',
    name: 'Kaveri Organza Saree',
    category: 'Silk Sarees',
    description:
      'A featherweight organza saree in bottle green, printed with a soft block-derived floral and finished with a narrow antique-gold tissue border. It weighs almost nothing, which makes it the saree to reach for in an Ahmedabad summer — the drape stays soft and it packs flat.',
    price: 16400,
    images: shots(5),
    sizes: FREE_SIZE,
    colors: [BOTTLE, ROSE, INDIGO],
    stock: 15,
    material: 'Silk organza with antique-gold tissue border',
    care: [
      'Dry clean only',
      'Keep away from perfume and deodorant to protect the organza',
      'Store on a padded hanger between muslin sheets',
    ],
    details: [
      { label: 'Saree Length', value: '5.5 metres, including 0.8 metre unstitched blouse fabric' },
      { label: 'Weave', value: 'Printed silk organza' },
      { label: 'Border', value: 'Narrow antique-gold tissue edge' },
      { label: 'Occasion', value: 'Daytime, summer, daytime receptions' },
      { label: 'Made In', value: 'Surat, Gujarat' },
    ],
    isFeatured: false,
    isNew: true,
  },
  {
    id: 'avn-1007',
    slug: 'naina-zardozi-kurta',
    name: 'Naina Zardozi Kurta',
    category: 'Kurtas',
    description:
      'An everyday kurta in saffron handloom cotton, cut slightly longer and fuller than a classic straight kurta, with antique-gold zardozi worked only at the neckline. Everything else is left quiet — the point is a piece you can reach for without thinking about it.',
    price: 8950,
    images: shots(6),
    sizes: APPAREL_SIZES,
    colors: [SAFFRON],
    stock: 3,
    material: 'Handloom cotton with antique-gold zardozi at the neckline',
    care: [
      'Hand wash separately in cold water for the first wash',
      'Dry in shade to protect the zardozi',
      'Iron on reverse with a cloth between the embellishment and the iron',
    ],
    details: [
      { label: 'Length', value: '44 inch, side slits' },
      { label: 'Handwork', value: 'Antique-gold zardozi at the neckline only' },
      { label: 'Fabric', value: 'Handloom cotton, 80 count' },
      { label: 'Occasion', value: 'Everyday, daytime, casual festive' },
      { label: 'Made In', value: 'Chanderi, Madhya Pradesh' },
    ],
    isFeatured: false,
    isNew: false,
  },
  {
    id: 'avn-1008',
    slug: 'tara-banarasi-dupatta',
    name: 'Tara Banarasi Dupatta',
    category: 'Dupattas',
    description:
      'A sheer Banarasi dupatta in antique gold, woven with a small buti scattered across the field and a richly worked kalga border on all four sides. Light enough to drape over a heavy lehenga without weighing it down, substantial enough to carry an ensemble on its own.',
    price: 6400,
    images: shots(7),
    sizes: FREE_SIZE,
    colors: [GOLD, ROSE, ONYX],
    stock: 0,
    material: 'Sheer Banarasi silk organza with woven zari border',
    care: [
      'Dry clean only',
      'Fold loosely rather than pressing the zari border flat',
      'Store away from direct light to keep the gold from tarnishing',
    ],
    details: [
      { label: 'Dimensions', value: '2.4 metres x 1.1 metre' },
      { label: 'Weave', value: 'Banarasi, kadhwa buti, kalga border' },
      { label: 'Border', value: 'Worked on all four sides' },
      { label: 'Occasion', value: 'Bridal, festive, ceremony' },
      { label: 'Made In', value: 'Varanasi, Uttar Pradesh' },
    ],
    isFeatured: false,
    isNew: false,
  },
  {
    id: 'avn-1009',
    slug: 'ayaan-handloom-cotton-jacket',
    name: 'Ayaan Handloom Jacket',
    category: 'Jackets',
    description:
      'An unlined jacket in indigo handloom cotton, cut boxy and cropped so it sits cleanly over a kurta or a plain sari blouse. Slubbed by the loom rather than by a mill, so no two lengths are exactly alike. This edition is in its final run.',
    price: 11200,
    // No client photograph was supplied for this piece, so it keeps the last
    // sample frame. Drop this to a single image once the ninth shot arrives.
    images: [
      {
        src: 'https://images.pexels.com/photos/28382914/pexels-photo-28382914.jpeg?auto=compress&cs=tinysrgb&w=1400',
        alt: 'A skilled artisan weaving fabric on a traditional handloom',
      },
      {
        src: 'https://images.pexels.com/photos/28382914/pexels-photo-28382914.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1500',
        alt: 'Slubbed handloom cotton in the weave',
      },
      {
        src: 'https://images.pexels.com/photos/12725952/pexels-photo-12725952.jpeg?auto=compress&cs=tinysrgb&w=1200',
        alt: 'Full-length view of a woman in a flowing traditional Indian ensemble indoors',
      },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [INDIGO, ONYX, SAND],
    stock: 2,
    material: 'Handloom cotton, unlined',
    care: [
      'Machine wash cold, inside out',
      'Line dry in shade — the indigo will lighten in direct sun',
      'Warm iron; the unlined body presses easily',
    ],
    details: [
      { label: 'Length', value: '22 inch from shoulder, cropped' },
      { label: 'Fit', value: 'Boxy, cut to sit over a kurta' },
      { label: 'Fabric', value: 'Slubbed handloom cotton, naturally dyed indigo' },
      { label: 'Occasion', value: 'Everyday, travel, casual' },
      { label: 'Made In', value: 'Kachchh, Gujarat' },
    ],
    isFeatured: false,
    isNew: false,
  },
];

export const APPAREL_SIZE_RUN = APPAREL_SIZES;
export const UNSTITCHED_SIZE = FREE_SIZE[0];

export const categories: string[] = Array.from(new Set(products.map((product) => product.category)));

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getNewArrivals(): Product[] {
  return products.filter((product) => product.isNew);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.isFeatured);
}

export function productHref(product: Product): string {
  return `/products/${product.slug}`;
}

/**
 * Related products: same category first, then anything else in the catalogue,
 * never the product itself. Deterministic so server and client agree.
 */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const others = products.filter((candidate) => candidate.id !== product.id);
  const sameCategory = others.filter((candidate) => candidate.category === product.category);
  const rest = others.filter((candidate) => candidate.category !== product.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

export function isInStock(product: Product): boolean {
  return product.stock > 0;
}

/** Coarse availability used for the stock line on the product page. */
export type StockStatus = 'in-stock' | 'low-stock' | 'sold-out';

export function getStockStatus(product: Product): StockStatus {
  if (product.stock <= 0) return 'sold-out';
  if (product.stock <= 5) return 'low-stock';
  return 'in-stock';
}

/** A single size run keeps the selector honest — there is nothing to choose. */
export function hasSizeChoice(product: Product): boolean {
  return product.sizes.length > 1;
}

export function hasColorChoice(product: Product): boolean {
  return product.colors.length > 1;
}

export type Collection = {
  label: string;
  name: string;
  description: string;
  image: string;
  alt: string;
  href: string;
};

export const collections: Collection[] = [
  {
    label: '01',
    name: 'Heritage',
    description:
      'Rich textures, traditional craftsmanship and timeless Indian details reinterpreted for today.',
    image:
      'https://images.pexels.com/photos/37975932/pexels-photo-37975932.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Close-up of intricately embroidered Indian textile in deep red thread',
    href: '/collections#heritage',
  },
  {
    label: '02',
    name: 'Modern Heirlooms',
    description: 'Contemporary silhouettes inspired by the elegance of Indian ceremonial dressing.',
    image:
      'https://images.pexels.com/photos/36880919/pexels-photo-36880919.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Woman wearing a red saree with traditional jewellery, photographed in low warm light',
    href: '/collections#modern-heirlooms',
  },
  {
    label: '03',
    name: 'The Everyday Edit',
    description: 'Effortless Indian-fusion pieces designed for modern everyday living.',
    image:
      'https://images.pexels.com/photos/35212993/pexels-photo-35212993.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Woman in a green saree photographed in a clean studio setting',
    href: '/collections#the-everyday-edit',
  },
];

export function isNewArrival(product: { isNew: boolean }): boolean {
  return product.isNew;
}
