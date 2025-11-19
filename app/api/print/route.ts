import { NextRequest, NextResponse } from 'next/server';
import { ZPLGenerator } from '@/lib/zpl-generator';
import { PrintRequest, LabelDesign } from '@/lib/types';
import { requireAuth } from '@/lib/auth-helpers';
import { sendZplToPrinter } from '@/lib/printer';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated. Please complete OAuth flow.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Support both single print and bulk print
    const isBulk = Array.isArray(body.items);
    
    if (isBulk) {
      // Bulk print: body.items is an array
      const { items, design } = body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Missing or empty items array' },
          { status: 400 }
        );
      }

      if (!design) {
        return NextResponse.json(
          { error: 'Missing required field: design' },
          { status: 400 }
        );
      }

      // Generate ZPL for all items
      const zplCommands: string[] = [];
      for (const item of items) {
        const { quantity = 1 } = item;
        if (quantity < 1 || quantity > 1000) {
          continue; // Skip invalid quantities
        }
        for (let i = 0; i < quantity; i++) {
          zplCommands.push(ZPLGenerator.generateFromDesign(design));
        }
      }
      
      const zpl = zplCommands.join('\n');
      const count = zplCommands.length;

      // Send ZPL to printer
      await sendZplToPrinter(zpl);

      return NextResponse.json({
        success: true,
        zpl,
        count,
        message: `Generated and sent ZPL for ${count} label(s)`,
      });
    } else {
      // Single print: legacy format
      const { productId, variantId, quantity, design } = body as PrintRequest;

      // Validate request
      if (!productId || !design) {
        return NextResponse.json(
          { error: 'Missing required fields: productId, design' },
          { status: 400 }
        );
      }

      if (quantity < 1 || quantity > 1000) {
        return NextResponse.json(
          { error: 'Quantity must be between 1 and 1000' },
          { status: 400 }
        );
      }

      // Generate ZPL for the specified quantity
      const zplCommands: string[] = [];
      for (let i = 0; i < quantity; i++) {
        zplCommands.push(ZPLGenerator.generateFromDesign(design));
      }
      const zpl = zplCommands.join('\n');

      // Send ZPL to printer
      await sendZplToPrinter(zpl);

      return NextResponse.json({
        success: true,
        zpl,
        quantity,
        message: `Generated and sent ZPL for ${quantity} label(s)`,
      });
    }
  } catch (error) {
    console.error('Print error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate print job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

