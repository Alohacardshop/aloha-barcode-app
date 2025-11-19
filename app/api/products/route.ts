import { NextRequest, NextResponse } from 'next/server';
import shopify from '@/lib/shopify';
import { Product } from '@/lib/types';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please complete OAuth flow.' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days');
    const tagsParam = searchParams.get('tags');
    const searchParam = searchParams.get('search');
    const inStockOnlyParam = searchParams.get('inStockOnly');
    const inStockOnly = inStockOnlyParam !== 'false'; // Default to true

    const client = new shopify.clients.Rest({ session });
    
    // Fetch products with inventory levels
    const response = await client.get({ path: 'products', query: { limit: 250 } });
    
    // Fetch inventory for all variants
    // Note: Inventory API requires inventory_item_id which may not be in the initial response
    // For now, we'll set inventory to 0 and note that full inventory tracking requires additional API calls
    const inventoryMap = new Map<string, number>();
    
    // Try to get inventory levels if available
    // This is a simplified version - in production you'd need to batch inventory_item_ids
    for (const product of response.body.products || []) {
      for (const variant of product.variants || []) {
        // Default to 0 if we can't fetch inventory
        // In production, you'd fetch inventory_levels using inventory_item_id
        inventoryMap.set(variant.id.toString(), 0);
      }
    }

    let products: Product[] = (response.body.products || []).map((p: any) => {
      const variants = (p.variants || []).map((v: any) => ({
        id: v.id.toString(),
        title: v.title,
        price: v.price,
        sku: v.sku || '',
        barcode: v.barcode || undefined,
        inventoryQty: inventoryMap.get(v.id.toString()) || 0,
      }));
      
      const totalInventory = variants.reduce((sum: number, v: any) => sum + (v.inventoryQty || 0), 0);

      return {
        id: p.id.toString(),
        title: p.title,
        handle: p.handle,
        tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()) : [],
        images: (p.images || []).map((img: any) => ({
          src: img.src,
          alt: img.alt || p.title,
        })),
        variants,
        totalInventory,
        createdAt: p.created_at,
      };
    });

    // Filter by days (created_at >= now - days)
    if (daysParam) {
      const days = parseInt(daysParam);
      if (!isNaN(days)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        products = products.filter(p => {
          const createdDate = new Date(p.createdAt);
          return createdDate >= cutoffDate;
        });
      }
    }

    // Filter by tags (comma-separated list)
    if (tagsParam) {
      const filterTags = tagsParam.split(',').map(t => t.trim().toLowerCase());
      products = products.filter(p => {
        return p.tags.some(tag => filterTags.includes(tag.toLowerCase()));
      });
    }

    // Filter by search (product title or variant SKU/barcode)
    if (searchParam) {
      const searchLower = searchParam.toLowerCase();
      products = products.filter(p => {
        const matchesTitle = p.title.toLowerCase().includes(searchLower);
        const matchesVariant = p.variants.some(v => 
          v.sku?.toLowerCase().includes(searchLower) ||
          v.barcode?.toLowerCase().includes(searchLower)
        );
        return matchesTitle || matchesVariant;
      });
    }

    // Filter by inventory (inStockOnly)
    if (inStockOnly) {
      products = products.filter(p => (p.totalInventory || 0) > 0);
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

