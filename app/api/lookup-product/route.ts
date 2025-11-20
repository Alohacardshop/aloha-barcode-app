import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import shopify from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await requireAuth(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - no valid session found' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { barcode } = body;

    if (!barcode || typeof barcode !== 'string') {
      return NextResponse.json(
        { error: 'Barcode is required and must be a string' },
        { status: 400 }
      );
    }

    // Create GraphQL client
    const client = new shopify.clients.Graphql({ session });

    // Query for product variant by barcode or SKU
    const query = `
      query findProductByBarcode($query: String!) {
        productVariants(first: 1, query: $query) {
          edges {
            node {
              id
              title
              sku
              barcode
              inventoryItem {
                id
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      id
                      available
                      location {
                        id
                        name
                      }
                    }
                  }
                }
              }
              product {
                id
                title
              }
            }
          }
        }
      }
    `;

    // Try searching by barcode first, then by SKU
    let response: any = await client.query({
      data: {
        query,
        variables: {
          query: `barcode:${barcode}`,
        },
      },
    });

    let variant = response.body?.data?.productVariants?.edges?.[0]?.node;

    // If no result by barcode, try SKU
    if (!variant) {
      response = await client.query({
        data: {
          query,
          variables: {
            query: `sku:${barcode}`,
          },
        },
      });
      variant = response.body?.data?.productVariants?.edges?.[0]?.node;
    }

    if (!variant) {
      return NextResponse.json(
        { error: 'No product found with that barcode or SKU' },
        { status: 404 }
      );
    }

    // Format inventory levels
    const inventoryLevels = variant.inventoryItem?.inventoryLevels?.edges?.map(
      (edge: any) => ({
        locationId: edge.node.location.id,
        locationName: edge.node.location.name,
        available: edge.node.available,
      })
    ) || [];

    // Return formatted result
    return NextResponse.json({
      productId: variant.product.id,
      productTitle: variant.product.title,
      variantId: variant.id,
      variantTitle: variant.title,
      sku: variant.sku || '',
      barcode: variant.barcode || '',
      inventoryItemId: variant.inventoryItem?.id || '',
      inventoryLevels,
    });

  } catch (error: any) {
    console.error('Error looking up product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to lookup product' },
      { status: 500 }
    );
  }
}
