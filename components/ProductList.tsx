'use client';

import { Card, ResourceList, ResourceItem, Thumbnail, Text, Badge } from '@shopify/polaris';
import { Product } from '@/lib/types';
import { FilterState } from './ProductFilters';

interface ProductListProps {
  products: Product[];
  filters: FilterState;
  onProductSelect: (product: Product) => void;
}

export default function ProductList({ products, filters, onProductSelect }: ProductListProps) {
  const filteredProducts = products
    .filter(product => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          product.title.toLowerCase().includes(searchLower) ||
          product.variants.some(v => 
            v.sku?.toLowerCase().includes(searchLower) ||
            v.barcode?.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      if (filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => product.tags.includes(tag));
        if (!hasTag) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  return (
    <Card>
      <ResourceList
        resourceName={{ singular: 'product', plural: 'products' }}
        items={filteredProducts}
        renderItem={(product) => {
          const { id, title, images, tags, variants } = product;
          const media = images[0] ? (
            <Thumbnail source={images[0].src} alt={images[0].alt} />
          ) : undefined;

          return (
            <ResourceItem
              id={id}
              media={media}
              accessibilityLabel={`View ${title}`}
              onClick={() => onProductSelect(product)}
            >
              <div>
                <Text variant="bodyMd" fontWeight="bold" as="h3">
                  {title}
                </Text>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', marginBottom: '4px' }}>
                  {tags.slice(0, 3).map(tag => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
                <Text variant="bodySm" tone="subdued" as="p">
                  {variants.length} variant{variants.length !== 1 ? 's' : ''}
                </Text>
              </div>
            </ResourceItem>
          );
        }}
      />
    </Card>
  );
}

