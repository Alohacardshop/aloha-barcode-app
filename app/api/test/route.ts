import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import shopify from '@/lib/shopify';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await requireAuth(request);
    if (!session) {
      return NextResponse.json(
        { 
          error: 'Unauthorized - no valid session found',
          message: 'Please ensure the app is properly installed and you are accessing it from Shopify Admin'
        },
        { status: 401 }
      );
    }

    // Create GraphQL client
    const client = new shopify.clients.Graphql({ session });

    // Test query to get shop info and product count
    const query = `
      query {
        shop {
          name
          myshopifyDomain
          email
          plan {
            displayName
          }
        }
        products(first: 5) {
          edges {
            node {
              id
              title
              status
              totalInventory
              variants(first: 3) {
                edges {
                  node {
                    id
                    title
                    sku
                    barcode
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response: any = await client.query({
      data: { query },
    });

    const data = response.body?.data;

    if (!data) {
      return NextResponse.json(
        { 
          error: 'No data returned from Shopify API',
          response: response.body
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Connection successful!',
      shop: data.shop,
      sampleProducts: data.products.edges.map((edge: any) => ({
        id: edge.node.id,
        title: edge.node.title,
        status: edge.node.status,
        totalInventory: edge.node.totalInventory,
        variants: edge.node.variants.edges.map((v: any) => ({
          id: v.node.id,
          title: v.node.title,
          sku: v.node.sku,
          barcode: v.node.barcode,
        }))
      })),
      session: {
        shop: session.shop,
        isOnline: session.isOnline,
        scope: session.scope,
      }
    });

  } catch (error: any) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
