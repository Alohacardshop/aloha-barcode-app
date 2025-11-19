/**
 * Label Size Constants
 * 
 * Standard label size: 2" x 1"
 * Printer DPI: 203 dots per inch
 */
export const LABEL_WIDTH_INCHES = 2;
export const LABEL_HEIGHT_INCHES = 1;
export const PRINTER_DPI = 203;

export const LABEL_WIDTH_DOTS = LABEL_WIDTH_INCHES * PRINTER_DPI; // 406
export const LABEL_HEIGHT_DOTS = LABEL_HEIGHT_INCHES * PRINTER_DPI; // 203

export const DEFAULT_LABEL_DESIGN = {
  width: LABEL_WIDTH_DOTS,
  height: LABEL_HEIGHT_DOTS,
  fields: [],
};

