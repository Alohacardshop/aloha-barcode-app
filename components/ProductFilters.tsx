'use client';

import { useState, useCallback } from 'react';
import { Card, TextField, Select, Badge, Button, Checkbox } from '@shopify/polaris';

export interface FilterState {
  search: string;
  tags: string[];
  days?: number;
  inStockOnly: boolean;
  sortBy: 'recent' | 'title' | 'created';
}

interface ProductFiltersProps {
  allTags: string[];
  onFilterChange: (filters: FilterState) => void;
}

export default function ProductFilters({ allTags, onFilterChange }: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tags: [],
    days: undefined,
    inStockOnly: true,
    sortBy: 'recent',
  });

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    const updated = { ...filters, ...updates };
    setFilters(updated);
    onFilterChange(updated);
  }, [filters, onFilterChange]);

  const toggleTag = useCallback((tag: string) => {
    const updatedTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: updatedTags });
  }, [filters.tags, updateFilters]);

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TextField
          label="Search products"
          value={filters.search}
          onChange={(value) => updateFilters({ search: value })}
          placeholder="Search by title, SKU, or barcode..."
          autoComplete="off"
        />

        <Select
          label="Time Period"
          options={[
            { label: 'All Products', value: '' },
            { label: 'Last 1 Day', value: '1' },
            { label: 'Last 7 Days', value: '7' },
            { label: 'Last 30 Days', value: '30' },
          ]}
          value={filters.days?.toString() || ''}
          onChange={(value) => updateFilters({ days: value ? parseInt(value) : undefined })}
        />

        <Select
          label="Sort by"
          options={[
            { label: 'Most Recent', value: 'recent' },
            { label: 'Title (A-Z)', value: 'title' },
            { label: 'Date Created', value: 'created' },
          ]}
          value={filters.sortBy}
          onChange={(value) => updateFilters({ sortBy: value as FilterState['sortBy'] })}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>Filter by tags:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allTags.map(tag => (
              <div
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{ cursor: 'pointer' }}
              >
                <Badge tone={filters.tags.includes(tag) ? 'success' : undefined}>
                  {tag}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Checkbox
          label="Only show products with inventory"
          checked={filters.inStockOnly}
          onChange={(checked) => updateFilters({ inStockOnly: checked })}
        />

        {(filters.search || filters.tags.length > 0 || filters.days || !filters.inStockOnly) && (
          <Button onClick={() => {
            const cleared = { search: '', tags: [], days: undefined, inStockOnly: true, sortBy: 'recent' as const };
            setFilters(cleared);
            onFilterChange(cleared);
          }}>
            Clear filters
          </Button>
        )}
      </div>
    </Card>
  );
}

