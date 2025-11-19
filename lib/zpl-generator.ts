import { LabelDesign, LabelField, getLabelDimensions } from './types';
import { LABEL_WIDTH_DOTS, LABEL_HEIGHT_DOTS } from './label-constants';

export class ZPLGenerator {
  private commands: string[] = [];

  constructor(private design: LabelDesign) {
    const { width, height } = getLabelDimensions(design);
    this.commands.push('^XA'); // Start label
    this.commands.push(`^PW${width}`); // Print width (always 406 for 2")
    this.commands.push(`^LL${height}`); // Label length (always 203 for 1")
  }

  private addField(field: LabelField): void {
    const { type, x, y, width, height, content, fontSize = 20, fontFamily = '0' } = field;

    switch (type) {
      case 'text':
        // Font selection: 0=A, 1=B, 2=C, 3=D, 4=E, 5=F
        // Format: ^FOx,y^A[font][orientation],[height],[width]^FDtext^FS
        const fontCode = fontFamily === '1' ? 'B' : fontFamily === '2' ? 'C' : 'A';
        this.commands.push(
          `^FO${x},${y}^A${fontCode}N,${fontSize},${fontSize}^FD${this.escapeZPL(content)}^FS`
        );
        break;

      case 'barcode':
        // Code 128 barcode
        // Format: ^FOx,y^BY[module width],[ratio],[height]^BC[orientation],[height],[print interpretation line],[print interpretation line above code],[check digit]^FDdata^FS
        const moduleWidth = Math.max(1, Math.floor(width / 10));
        const barHeight = Math.max(10, height);
        this.commands.push(
          `^FO${x},${y}^BY${moduleWidth},2,${barHeight}^BCN,${barHeight},Y,N,N^FD${this.escapeZPL(content)}^FS`
        );
        break;

      case 'qrcode':
        // QR Code
        // Format: ^FOx,y^BQ[orientation],[model],[size],[error correction level],[mask]^FD[data]^FS
        const qrSize = Math.max(1, Math.min(10, Math.floor(height / 20)));
        this.commands.push(
          `^FO${x},${y}^BQN,2,${qrSize}^FDQA,${this.escapeZPL(content)}^FS`
        );
        break;

      case 'image':
        // Note: Images need to be converted to GRF format first
        // This is a placeholder - you'd need image processing
        // For now, we'll skip images or use a placeholder
        this.commands.push(
          `^FO${x},${y}^GFA,${width * height / 8},${width * height / 8},${width / 8},${content}^FS`
        );
        break;
    }
  }

  private escapeZPL(text: string): string {
    // Escape special ZPL characters
    return text
      .replace(/\^/g, '^')
      .replace(/~/g, '~~')
      .replace(/\_/g, '~_');
  }

  generate(): string {
    this.design.fields.forEach(field => {
      if (field.content) {
        this.addField(field);
      }
    });
    this.commands.push('^XZ'); // End label
    return this.commands.join('\n');
  }

  static generateFromDesign(design: LabelDesign): string {
    const generator = new ZPLGenerator(design);
    return generator.generate();
  }
}

