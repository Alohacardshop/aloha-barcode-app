'use client';

import { useState, useEffect } from 'react';
import { Page, Layout, Button, Banner } from '@shopify/polaris';
import ProductListWithSelection from '@/components/ProductListWithSelection';
import ProductFilters, { FilterState } from '@/components/ProductFilters';
import { Product, LabelProfile, LabelDesign } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tags: [],
    inStockOnly: true,
    sortBy: 'recent',
  });
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedVariants, setSelectedVariants] = useState<Map<string, string>>(new Map()); // productId -> variantId
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    // Build query string from filters
    const params = new URLSearchParams();
    if (filters.days) {
      params.set('days', filters.days.toString());
    }
    if (filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }
    if (filters.search) {
      params.set('search', filters.search);
    }
    if (filters.inStockOnly) {
      params.set('inStockOnly', 'true');
    }

    const queryString = params.toString();
    const url = `/api/products${queryString ? `?${queryString}` : ''}`;

    // Fetch products from Shopify API
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const fetchedProducts = data.products || [];
        setProducts(fetchedProducts);
        
        // Collect all tags from all products (not just filtered)
        fetch('/api/products')
          .then(res => res.json())
          .then(allData => {
            const tags = new Set<string>();
            allData.products?.forEach((p: Product) => {
              p.tags.forEach(tag => tags.add(tag));
            });
            setAllTags(Array.from(tags));
          })
          .catch(console.error);
      })
      .catch(console.error);
  }, [filters.days, filters.tags, filters.search, filters.inStockOnly]);

  const [defaultProfile, setDefaultProfile] = useState<LabelProfile | null>(null);

  useEffect(() => {
    // Load default profile for bulk print
    fetch('/api/profiles/default')
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setDefaultProfile(data.profile);
        }
      })
      .catch(() => {
        // No default profile
      });
  }, []);

  const handleProductSelect = (product: Product) => {
    // Navigate to designer with product selected
    if (typeof window !== 'undefined') {
      window.location.href = `/app/designer?productId=${product.id}`;
    }
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        // Also remove variant selection
        setSelectedVariants(prevVariants => {
          const nextVariants = new Map(prevVariants);
          nextVariants.delete(productId);
          return nextVariants;
        });
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleVariantToggle = (productId: string, variantId: string) => {
    setSelectedVariants(prev => {
      const next = new Map(prev);
      if (next.get(productId) === variantId) {
        next.delete(productId);
      } else {
        next.set(productId, variantId);
      }
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(products.map(p => p.id));
      setSelectedProducts(allIds);
    } else {
      setSelectedProducts(new Set());
      setSelectedVariants(new Map());
    }
  };

  const handleBulkPrint = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }

    if (!defaultProfile) {
      alert('No default profile found. Please set a default profile in the Designer.');
      return;
    }

    const items: Array<{ productId: string; variantId?: string; quantity: number }> = [];
    
    for (const productId of selectedProducts) {
      const product = products.find(p => p.id === productId);
      if (!product) continue;

      const variantId = selectedVariants.get(productId);
      
      // If variant selected, use it; otherwise use first variant
      const targetVariantId = variantId || (product.variants.length > 0 ? product.variants[0].id : undefined);
      
      items.push({
        productId,
        variantId: targetVariantId,
        quantity: 1, // Default quantity, could be made editable
      });
    }

    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          design: defaultProfile.design,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Bulk print job created! ${data.message}`);
        console.log('ZPL Code:', data.zpl);
        // Clear selections
        setSelectedProducts(new Set());
        setSelectedVariants(new Map());
      } else {
        alert('Bulk print failed: ' + data.error);
      }
    } catch (error) {
      console.error('Bulk print error:', error);
      alert('Failed to create bulk print job');
    }
  };

  return (
    <Page 
      title="Products"
      primaryAction={
        selectedProducts.size > 0 ? {
          content: `Bulk Print (${selectedProducts.size})`,
          onAction: handleBulkPrint,
        } : undefined
      }
    >
      {selectedProducts.size > 0 && !defaultProfile && (
        <Banner tone="warning" onDismiss={() => {}}>
          <p>No default profile set. Please set a default profile in the Designer before bulk printing.</p>
        </Banner>
      )}
      <Layout>
        <Layout.Section variant="oneThird">
          <ProductFilters allTags={allTags} onFilterChange={setFilters} />
        </Layout.Section>
        <Layout.Section>
          <ProductListWithSelection
            products={products}
            filters={filters}
            selectedProducts={selectedProducts}
            selectedVariants={selectedVariants}
            onProductSelect={handleProductSelect}
            onProductToggle={handleProductToggle}
            onVariantToggle={handleVariantToggle}
            onSelectAll={handleSelectAll}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}

