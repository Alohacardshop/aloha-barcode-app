'use client';

import { Card, ResourceList, ResourceItem, Thumbnail, Text, Badge, Checkbox } from '@shopify/polaris';
import { Product } from '@/lib/types';
import { FilterState } from './ProductFilters';

interface ProductListWithSelectionProps {
  products: Product[];
  filters: FilterState;
  selectedProducts: Set<string>;
  selectedVariants: Map<string, string>;
  onProductSelect: (product: Product) => void;
  onProductToggle: (productId: string) => void;
  onVariantToggle: (productId: string, variantId: string) => void;
  onSelectAll: (selected: boolean) => void;
}

export default function ProductListWithSelection({
  products,
  filters,
  selectedProducts,
  selectedVariants,
  onProductSelect,
  onProductToggle,
  onVariantToggle,
  onSelectAll,
}: ProductListWithSelectionProps) {
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

  const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.has(p.id));

  return (
    <Card>
      <div style={{ padding: '12px', borderBottom: '1px solid #e1e3e5' }}>
        <Checkbox
          label="Select all on this page"
          checked={allSelected}
          onChange={onSelectAll}
        />
      </div>
      <ResourceList
        resourceName={{ singular: 'product', plural: 'products' }}
        items={filteredProducts}
        renderItem={(product) => {
          const { id, title, images, tags, variants, totalInventory } = product;
          const media = images[0] ? (
            <Thumbnail source={images[0].src} alt={images[0].alt} />
          ) : undefined;
          const isProductSelected = selectedProducts.has(id);
          const selectedVariantId = selectedVariants.get(id);

          return (
            <ResourceItem
              id={id}
              media={media}
              accessibilityLabel={`View ${title}`}
              onClick={() => onProductSelect(product)}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Checkbox
                  checked={isProductSelected}
                  onChange={() => onProductToggle(id)}
                  label=""
                />
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onProductSelect(product)}>
                  <Text variant="bodyMd" fontWeight="bold" as="h3">
                    {title}
                  </Text>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', marginBottom: '4px' }}>
                    {tags.slice(0, 3).map(tag => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                  <Text variant="bodySm" tone="subdued" as="p">
                    {variants.length} variant{variants.length !== 1 ? 's' : ''} | 
                    Inventory: {totalInventory || 0}
                  </Text>
                  {isProductSelected && variants.length > 1 && (
                    <div style={{ marginTop: '8px' }}>
                      <Text variant="bodySm" as="p" fontWeight="medium">Select variant:</Text>
                      {variants.map(v => (
                        <div key={v.id} style={{ marginTop: '4px' }}>
                          <Checkbox
                            label={`${v.title} (${v.sku || 'No SKU'})`}
                            checked={selectedVariantId === v.id}
                            onChange={() => onVariantToggle(id, v.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ResourceItem>
          );
        }}
      />
    </Card>
  );
}

