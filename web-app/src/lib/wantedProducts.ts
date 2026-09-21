import { WantedLookItem } from '../components/trending/WantedQuickActionCard';

/**
 * The products the bag actually holds.
 *
 * "Eyes" and "Lips" were too broad to mean anything: a lip liner, a gloss and
 * a lipstick are three different things people are asking for, and the bag
 * already draws them as three different objects. These are the names those
 * objects go by.
 */
export const PRODUCTS = [
  'Lipstick',
  'Lip gloss',
  'Lip liner',
  'Eyeliner',
  'Eyeshadow',
  'Mascara',
  'Blush',
  'Bronzer'
] as const;

export type Product = (typeof PRODUCTS)[number];

/** Each product keeps its own colour wherever it is shown. */
export const PRODUCT_COLOURS: Record<Product, string> = {
  Lipstick: '#E91E63',
  'Lip gloss': '#F06292',
  'Lip liner': '#C2185B',
  Eyeliner: '#2A1715',
  Eyeshadow: '#6D4C41',
  Mascara: '#1C1512',
  Blush: '#B8887A',
  Bronzer: '#A9744F'
};

/**
 * What a request is actually for, read from what it is called and falling back
 * to the part of the face it was filed under.
 */
export function productOf(item: { name?: string; category?: string }): Product {
  const text = `${item.name || ''}`.toLowerCase();
  const category = item.category || '';

  if (text.includes('lip liner') || text.includes('lipliner')) return 'Lip liner';
  if (text.includes('gloss') || text.includes('balm') || text.includes('stain')) return 'Lip gloss';
  if (text.includes('mascara') || text.includes('lash')) return 'Mascara';
  if (text.includes('liner')) return category === 'Lips' ? 'Lip liner' : 'Eyeliner';
  if (text.includes('shadow') || text.includes('halo') || text.includes('smoke')) return 'Eyeshadow';
  if (text.includes('bronze') || text.includes('contour')) return 'Bronzer';
  if (text.includes('glow') || text.includes('highlight') || text.includes('stick')) return 'Bronzer';
  if (text.includes('blush') || text.includes('cheek') || text.includes('flush')) return 'Blush';
  if (text.includes('lip')) return 'Lipstick';
  if (text.includes('eye')) return 'Eyeshadow';

  switch (category) {
    case 'Lips':
      return 'Lipstick';
    case 'Blush':
      return 'Blush';
    case 'Highlight':
      return 'Bronzer';
    default:
      return 'Eyeshadow';
  }
}

export type ProductStat = { name: string; value: number; percentage: number };

/**
 * How the vote splits across products, biggest share first. Only products
 * anyone has actually asked for appear - an empty line is not a fact.
 */
export function productTally(items: WantedLookItem[], limit = 4): ProductStat[] {
  const totals = new Map<Product, number>();
  items.forEach((item) => {
    const product = productOf(item);
    totals.set(product, (totals.get(product) || 0) + (item.numericVotes || 0));
  });

  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return Array.from(totals.entries())
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
    }));
}
