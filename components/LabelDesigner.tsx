'use client';

import { useState, useCallback } from 'react';
import { Card, Button, TextField, Select } from '@shopify/polaris';
import { LabelDesign, LabelField, getLabelDimensions } from '@/lib/types';

interface LabelDesignerProps {
  onDesignChange: (design: LabelDesign) => void;
  initialDesign?: LabelDesign;
}

export default function LabelDesigner({ onDesignChange, initialDesign }: LabelDesignerProps) {
  const [design, setDesign] = useState<LabelDesign>(
    initialDesign || {
      fields: [],
    }
  );
  
  const { width, height } = getLabelDimensions(design);

  const addField = useCallback((type: LabelField['type']) => {
    const newField: LabelField = {
      id: `field-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: type === 'barcode' ? 200 : 100,
      height: type === 'barcode' ? 50 : 20,
      content: '',
      fontSize: 20,
    };

    setDesign(prev => {
      const updated = { ...prev, fields: [...prev.fields, newField] };
      onDesignChange(updated);
      return updated;
    });
  }, [onDesignChange]);

  const updateField = useCallback((fieldId: string, updates: Partial<LabelField>) => {
    setDesign(prev => {
      const updated = {
        ...prev,
        fields: prev.fields.map(f =>
          f.id === fieldId ? { ...f, ...updates } : f
        ),
      };
      onDesignChange(updated);
      return updated;
    });
  }, [onDesignChange]);

  const removeField = useCallback((fieldId: string) => {
    setDesign(prev => {
      const updated = {
        ...prev,
        fields: prev.fields.filter(f => f.id !== fieldId),
      };
      onDesignChange(updated);
      return updated;
    });
  }, [onDesignChange]);

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '12px', background: '#f6f6f7', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontWeight: 'medium' }}>
            Label Size: 2" × 1" ({width} × {height} dots) - Fixed
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={() => addField('text')}>Add Text</Button>
          <Button onClick={() => addField('barcode')}>Add Barcode</Button>
          <Button onClick={() => addField('qrcode')}>Add QR Code</Button>
        </div>

        {design.fields.map((field) => (
          <Card key={field.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Select
                label="Type"
                options={[
                  { label: 'Text', value: 'text' },
                  { label: 'Barcode', value: 'barcode' },
                  { label: 'QR Code', value: 'qrcode' },
                ]}
                value={field.type}
                onChange={(value) => updateField(field.id, { type: value as LabelField['type'] })}
              />
              <TextField
                label="Content"
                value={field.content}
                onChange={(value) => updateField(field.id, { content: value })}
                autoComplete="off"
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <TextField
                  label="X"
                  type="number"
                  value={field.x.toString()}
                  onChange={(value) => updateField(field.id, { x: parseInt(value) || 0 })}
                  autoComplete="off"
                />
                <TextField
                  label="Y"
                  type="number"
                  value={field.y.toString()}
                  onChange={(value) => updateField(field.id, { y: parseInt(value) || 0 })}
                  autoComplete="off"
                />
                <TextField
                  label="Width"
                  type="number"
                  value={field.width.toString()}
                  onChange={(value) => updateField(field.id, { width: parseInt(value) || 0 })}
                  autoComplete="off"
                />
                <TextField
                  label="Height"
                  type="number"
                  value={field.height.toString()}
                  onChange={(value) => updateField(field.id, { height: parseInt(value) || 0 })}
                  autoComplete="off"
                />
              </div>
              <Button tone="critical" onClick={() => removeField(field.id)}>
                Remove
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}

