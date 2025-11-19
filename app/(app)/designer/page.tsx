'use client';

import { useState, useEffect } from 'react';
import { Page, Layout, Card, Button, TextField, Select, Text, Banner, Link } from '@shopify/polaris';
import { useSearchParams, useRouter } from 'next/navigation';
import LabelDesignerCanvas from '@/components/LabelDesignerCanvas';
import ZPLPreview from '@/components/ZPLPreview';
import { LabelDesign, LabelTemplate, LabelProfile, Product } from '@/lib/types';
import { DEFAULT_LABEL_DESIGN } from '@/lib/label-constants';

export default function DesignerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('productId');
  const templateId = searchParams.get('templateId');
  
  const [design, setDesign] = useState<LabelDesign>(DEFAULT_LABEL_DESIGN);
  const [quantity, setQuantity] = useState('1');
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [profiles, setProfiles] = useState<LabelProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [profileName, setProfileName] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  // Load product if productId is present
  useEffect(() => {
    if (productId) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          const found = data.products?.find((p: Product) => p.id === productId);
          if (found) {
            setProduct(found);
          }
        })
        .catch(console.error);
    }
  }, [productId]);

  // Load templates
  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || []);
      })
      .catch(console.error);
  }, []);

  // Load profiles and default profile
  useEffect(() => {
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        setProfiles(data.profiles || []);
        const defaultProfile = data.profiles?.find((p: LabelProfile) => p.isDefault);
        if (defaultProfile) {
          setSelectedProfileId(defaultProfile.id);
          setDesign(defaultProfile.design);
          setProfileName(defaultProfile.name);
        }
      })
      .catch(console.error);

    // Also try to get default profile
    fetch('/api/profiles/default')
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setSelectedProfileId(data.profile.id);
          setDesign(data.profile.design);
          setProfileName(data.profile.name);
        }
      })
      .catch(() => {
        // No default profile, that's okay
      });
  }, []);

  // Load template if templateId is present
  useEffect(() => {
    if (templateId) {
      fetch(`/api/templates/${templateId}`)
        .then(res => res.json())
        .then(data => {
          if (data.template) {
            setDesign(data.template.design);
            setSelectedTemplateId(templateId);
          }
        })
        .catch(console.error);
    }
  }, [templateId]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTemplateId || undefined,
          name: templateName,
          design,
        }),
      });

      const data = await response.json();
      if (data.template) {
        alert('Template saved successfully!');
        setSelectedTemplateId(data.template.id);
        setTemplates(prev => {
          const existing = prev.findIndex(t => t.id === data.template.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = data.template;
            return updated;
          }
          return [data.template, ...prev];
        });
      }
    } catch (error) {
      console.error('Save template error:', error);
      alert('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}`);
      const data = await response.json();
      if (data.template) {
        setDesign(data.template.design);
        setSelectedTemplateId(id);
        setTemplateName(data.template.name);
      }
    } catch (error) {
      console.error('Load template error:', error);
      alert('Failed to load template');
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      alert('Please enter a profile name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProfileId || undefined,
          name: profileName,
          design,
          isDefault: false,
        }),
      });

      const data = await response.json();
      if (data.profile) {
        alert('Profile saved successfully!');
        setSelectedProfileId(data.profile.id);
        setProfiles(prev => {
          const existing = prev.findIndex(p => p.id === data.profile.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = data.profile;
            return updated;
          }
          return [data.profile, ...prev];
        });
      }
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultProfile = async () => {
    if (!selectedProfileId) {
      alert('Please select a profile first');
      return;
    }

    try {
      const response = await fetch('/api/profiles/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProfileId }),
      });

      const data = await response.json();
      if (data.profile) {
        alert('Default profile set successfully!');
        // Update profiles to reflect new default
        setProfiles(prev => prev.map(p => ({
          ...p,
          isDefault: p.id === selectedProfileId,
        })));
      }
    } catch (error) {
      console.error('Set default profile error:', error);
      alert('Failed to set default profile');
    }
  };

  const handleLoadProfile = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      setDesign(profile.design);
      setSelectedProfileId(id);
      setProfileName(profile.name);
    }
  };

  const handlePrint = async () => {
    if (!productId) {
      alert('Please select a product first');
      return;
    }

    // Use current design (from selected profile or manual edits)
    const printDesign = design;

    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity: parseInt(quantity) || 1,
          design: printDesign,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Print job created! ${data.message}`);
        console.log('ZPL Code:', data.zpl);
      } else {
        alert('Print failed: ' + data.error);
      }
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to create print job');
    }
  };

  return (
    <Page
      title="Label Designer"
      primaryAction={{
        content: 'Print Labels',
        onAction: handlePrint,
        disabled: !productId,
      }}
    >
      {!productId && (
        <Banner tone="info" onDismiss={() => {}}>
          <p>No product selected. <Link url="/app/products">Select a product</Link> to design a label.</p>
        </Banner>
      )}

      {product && (
        <Card>
          <div style={{ padding: '16px' }}>
            <Text variant="headingMd" as="h3">{product.title}</Text>
            <div style={{ marginTop: '8px' }}>
              {product.variants.length > 0 && (
                <Text as="p" variant="bodySm">
                  SKU: {product.variants[0].sku || 'N/A'} | 
                  Barcode: {product.variants[0].barcode || 'N/A'}
                </Text>
              )}
              {product.tags.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {product.tags.map(tag => (
                    <span key={tag} style={{ 
                      background: '#e1e3e5', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <Layout>
        <Layout.Section>
          <LabelDesignerCanvas onDesignChange={setDesign} initialDesign={design} />
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={setQuantity}
                autoComplete="off"
                min={1}
              />

              <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '16px' }}>
                <Text variant="headingSm" as="h3">Label Profile</Text>
                
                <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                  <Select
                    label="Select Profile"
                    options={[
                      { label: 'New Profile', value: '' },
                      ...profiles.map(p => ({ 
                        label: `${p.name}${p.isDefault ? ' (Default)' : ''}`, 
                        value: p.id 
                      })),
                    ]}
                    value={selectedProfileId}
                    onChange={(value) => {
                      if (value) {
                        handleLoadProfile(value);
                      } else {
                        setSelectedProfileId('');
                        setProfileName('');
                        setDesign(DEFAULT_LABEL_DESIGN);
                      }
                    }}
                  />
                </div>

                <TextField
                  label="Profile Name"
                  value={profileName}
                  onChange={setProfileName}
                  placeholder="Enter profile name to save"
                  autoComplete="off"
                />

                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <Button 
                    onClick={handleSaveProfile} 
                    loading={loading}
                    disabled={!profileName.trim()}
                    fullWidth
                  >
                    {selectedProfileId ? 'Update Profile' : 'Save as Profile'}
                  </Button>
                  
                  {selectedProfileId && (
                    <Button 
                      onClick={handleSetDefaultProfile}
                      fullWidth
                    >
                      Set as Default
                    </Button>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '16px' }}>
                <Text variant="headingSm" as="h3">Templates</Text>
                
                <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                  <Select
                    label="Load Template"
                    options={[
                      { label: 'New Template', value: '' },
                      ...templates.map(t => ({ label: t.name, value: t.id })),
                    ]}
                    value={selectedTemplateId}
                    onChange={(value) => {
                      if (value) {
                        handleLoadTemplate(value);
                      } else {
                        setSelectedTemplateId('');
                        setTemplateName('');
                        setDesign(DEFAULT_LABEL_DESIGN);
                      }
                    }}
                  />
                </div>

                <TextField
                  label="Template Name"
                  value={templateName}
                  onChange={setTemplateName}
                  placeholder="Enter template name to save"
                  autoComplete="off"
                />

                <Button 
                  onClick={handleSaveTemplate} 
                  loading={loading}
                  disabled={!templateName.trim()}
                  fullWidth
                >
                  {selectedTemplateId ? 'Update Template' : 'Save Template'}
                </Button>
              </div>

              <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '16px' }}>
                <ZPLPreview design={design} />
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
