export interface Product {
  id: string;
  title: string;
  handle: string;
  tags: string[];
  images: { src: string; alt: string }[];
  variants: {
    id: string;
    title: string;
    price: string;
    sku: string;
    barcode?: string;
    inventoryQty?: number;
  }[];
  totalInventory?: number;
  createdAt: string;
}

export interface LabelDesign {
  width?: number; // Defaults to 406 (2" at 203 DPI)
  height?: number; // Defaults to 203 (1" at 203 DPI)
  fields: LabelField[];
}

// Helper function to get label dimensions with defaults
export function getLabelDimensions(design?: Partial<LabelDesign>): { width: number; height: number } {
  // Dynamic import to avoid circular dependency issues
  const constants = require('./label-constants');
  return {
    width: design?.width ?? constants.LABEL_WIDTH_DOTS,
    height: design?.height ?? constants.LABEL_HEIGHT_DOTS,
  };
}

export interface LabelField {
  id: string;
  type: 'text' | 'barcode' | 'image' | 'qrcode';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface PrintRequest {
  productId: string;
  variantId?: string;
  quantity: number;
  design: LabelDesign;
}

export interface LabelTemplate {
  id: string;
  name: string;
  design: LabelDesign;
  createdAt: string;
  updatedAt: string;
}

export interface LabelProfile {
  id: string;
  name: string;
  description?: string;
  design: LabelDesign;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
