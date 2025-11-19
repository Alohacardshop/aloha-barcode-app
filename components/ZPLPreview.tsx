'use client';

import { Card, Text } from '@shopify/polaris';
import { LabelDesign } from '@/lib/types';
import { ZPLGenerator } from '@/lib/zpl-generator';

interface ZPLPreviewProps {
  design: LabelDesign;
}

export default function ZPLPreview({ design }: ZPLPreviewProps) {
  const zpl = ZPLGenerator.generateFromDesign(design);

  return (
    <Card>
      <Text variant="headingSm" as="h3">
        ZPL Preview
      </Text>
      <pre style={{ 
        background: '#f6f6f7', 
        padding: '12px', 
        borderRadius: '4px', 
        overflow: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        {zpl}
      </pre>
    </Card>
  );
}

