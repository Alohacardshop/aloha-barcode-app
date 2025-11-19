'use client';

import { useState, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { Card, Button, TextField, Select, Text } from '@shopify/polaris';
import { LabelDesign, LabelField, getLabelDimensions } from '@/lib/types';
import { LABEL_WIDTH_DOTS, LABEL_HEIGHT_DOTS, LABEL_WIDTH_INCHES, LABEL_HEIGHT_INCHES } from '@/lib/label-constants';

interface LabelDesignerCanvasProps {
  onDesignChange: (design: LabelDesign) => void;
  initialDesign?: LabelDesign;
}

export default function LabelDesignerCanvas({ onDesignChange, initialDesign }: LabelDesignerCanvasProps) {
  const defaultDesign: LabelDesign = {
    width: LABEL_WIDTH_DOTS,
    height: LABEL_HEIGHT_DOTS,
    fields: [],
  };

  const [design, setDesign] = useState<LabelDesign>(
    initialDesign || defaultDesign
  );
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  
  // Ensure design always has correct dimensions
  const { width, height } = getLabelDimensions(design);

  const updateDesign = useCallback((updated: LabelDesign) => {
    setDesign(updated);
    onDesignChange(updated);
  }, [onDesignChange]);

  const addField = useCallback((type: LabelField['type']) => {
    const newField: LabelField = {
      id: `field-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: type === 'barcode' ? 200 : type === 'qrcode' ? 100 : 150,
      height: type === 'barcode' ? 50 : type === 'qrcode' ? 100 : 30,
      content: '',
      fontSize: 20,
    };

    const updated = { ...design, fields: [...design.fields, newField] };
    updateDesign(updated);
    setSelectedFieldId(newField.id);
  }, [design, updateDesign]);

  const updateField = useCallback((fieldId: string, updates: Partial<LabelField>) => {
    const updated = {
      ...design,
      fields: design.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    };
    updateDesign(updated);
  }, [design, updateDesign]);

  const removeField = useCallback((fieldId: string) => {
    const updated = {
      ...design,
      fields: design.fields.filter(f => f.id !== fieldId),
    };
    updateDesign(updated);
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }, [design, updateDesign, selectedFieldId]);

  const selectedField = design.fields.find(f => f.id === selectedFieldId);

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '300px' }}>
          <div style={{ padding: '12px', background: '#f6f6f7', borderRadius: '4px' }}>
            <Text as="p" variant="bodyMd" fontWeight="medium">
              Label Size: {LABEL_WIDTH_INCHES}" × {LABEL_HEIGHT_INCHES}" ({LABEL_WIDTH_DOTS} × {LABEL_HEIGHT_DOTS} dots)
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Standard 2" × 1" label at 203 DPI
            </Text>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button onClick={() => addField('text')}>Add Text</Button>
            <Button onClick={() => addField('barcode')}>Add Barcode</Button>
            <Button onClick={() => addField('qrcode')}>Add QR Code</Button>
          </div>

          {selectedField && (
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Select
                  label="Type"
                  options={[
                    { label: 'Text', value: 'text' },
                    { label: 'Barcode', value: 'barcode' },
                    { label: 'QR Code', value: 'qrcode' },
                  ]}
                  value={selectedField.type}
                  onChange={(value) => updateField(selectedField.id, { type: value as LabelField['type'] })}
                />
                <TextField
                  label="Content"
                  value={selectedField.content}
                  onChange={(value) => updateField(selectedField.id, { content: value })}
                  autoComplete="off"
                />
                {selectedField.type === 'text' && (
                  <TextField
                    label="Font Size"
                    type="number"
                    value={selectedField.fontSize?.toString() || '20'}
                    onChange={(value) => updateField(selectedField.id, { fontSize: parseInt(value) || 20 })}
                    autoComplete="off"
                  />
                )}
                <Button tone="critical" onClick={() => removeField(selectedField.id)}>
                  Remove Field
                </Button>
              </div>
            </Card>
          )}

          {design.fields.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6d7175' }}>
              Click "Add Text", "Add Barcode", or "Add QR Code" to start designing
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div
          style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            border: '2px solid #e1e3e5',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
          }}
        >
          {design.fields.map((field) => (
            <Rnd
              key={field.id}
              size={{ width: field.width, height: field.height }}
              position={{ x: field.x, y: field.y }}
              onDragStop={(e, d) => {
                updateField(field.id, { x: d.x, y: d.y });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                updateField(field.id, {
                  x: position.x,
                  y: position.y,
                  width: parseInt(ref.style.width) || field.width,
                  height: parseInt(ref.style.height) || field.height,
                });
              }}
              onClick={() => setSelectedFieldId(field.id)}
              style={{
                border: selectedFieldId === field.id ? '2px solid #008060' : '1px dashed #c9cccf',
                backgroundColor: selectedFieldId === field.id ? 'rgba(0, 128, 96, 0.1)' : 'transparent',
                cursor: 'move',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: field.fontSize || 12,
                overflow: 'hidden',
              }}
              bounds="parent"
            >
              <div style={{ 
                pointerEvents: 'none',
                textAlign: 'center',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: field.type === 'text' ? (field.fontSize || 12) : 10,
              }}>
                {field.type === 'text' && (
                  <span>{field.content || 'Text'}</span>
                )}
                {field.type === 'barcode' && (
                  <div style={{ 
                    width: '100%', 
                    height: '60%', 
                    border: '1px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                  }}>
                    {field.content || 'BARCODE'}
                  </div>
                )}
                {field.type === 'qrcode' && (
                  <div style={{ 
                    width: '80%', 
                    height: '80%', 
                    border: '2px solid #000',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gridTemplateRows: 'repeat(8, 1fr)',
                  }}>
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: Math.random() > 0.5 ? '#000' : '#fff',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Rnd>
          ))}
        </div>
      </Card>
    </div>
  );
}

