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
    const { inventoryItemId, locationId, newQuantity } = body;

    if (!inventoryItemId || !locationId || typeof newQuantity !== 'number') {
      return NextResponse.json(
        { error: 'inventoryItemId, locationId, and newQuantity are required' },
        { status: 400 }
      );
    }

    // Create GraphQL client
    const client = new shopify.clients.Graphql({ session });

    // First, get the current inventory level to calculate the adjustment
    const getCurrentLevelQuery = `
      query getInventoryLevel($inventoryItemId: ID!, $locationId: ID!) {
        inventoryLevel(inventoryItemId: $inventoryItemId, locationId: $locationId) {
          available
        }
      }
    `;

    const currentLevelResponse: any = await client.query({
      data: {
        query: getCurrentLevelQuery,
        variables: {
          inventoryItemId,
          locationId,
        },
      },
    });

    const currentAvailable = currentLevelResponse.body?.data?.inventoryLevel?.available || 0;
    const adjustment = newQuantity - currentAvailable;

    // Use inventoryAdjustQuantities mutation to update inventory
    const mutation = `
      mutation adjustInventory($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
          userErrors {
            field
            message
          }
          inventoryAdjustmentGroup {
            reason
            changes {
              name
              delta
            }
          }
        }
      }
    `;

    const response: any = await client.query({
      data: {
        query: mutation,
        variables: {
          input: {
            reason: "correction",
            name: "available",
            changes: [
              {
                inventoryItemId,
                locationId,
                delta: adjustment,
              }
            ]
          }
        },
      },
    });

    const userErrors = response.body?.data?.inventoryAdjustQuantities?.userErrors;

    if (userErrors && userErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: userErrors.map((e: any) => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Inventory updated successfully from ${currentAvailable} to ${newQuantity}`,
      previousQuantity: currentAvailable,
      newQuantity,
      adjustment,
    });

  } catch (error: any) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to update inventory'
      },
      { status: 500 }
    );
  }
}
