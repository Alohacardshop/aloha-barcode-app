"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Page, 
  Card, 
  Layout, 
  Text, 
  TextField, 
  Button, 
  Banner,
  BlockStack,
  InlineStack,
  Spinner,
  Box,
  Divider,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

interface ProductLookupResult {
  productId: string;
  productTitle: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  barcode: string;
  inventoryItemId: string;
  inventoryLevels: {
    locationId: string;
    locationName: string;
    available: number;
  }[];
}

export default function BarcodeScannerPage() {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ProductLookupResult | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Auto-focus on barcode input when component mounts
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError('Unable to access camera: ' + err.message);
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleLookup = async (barcodeValue?: string) => {
    const lookupBarcode = barcodeValue || barcode;
    
    if (!lookupBarcode.trim()) {
      setError('Please enter a barcode or SKU');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/lookup-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: lookupBarcode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to lookup product');
        return;
      }

      setResult(data);
      // Auto-select first location if available
      if (data.inventoryLevels.length > 0) {
        setSelectedLocation(data.inventoryLevels[0].locationId);
        setNewQuantity(data.inventoryLevels[0].available.toString());
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async () => {
    if (!result || !selectedLocation || !newQuantity) {
      setError('Please select a location and enter a quantity');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/update-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryItemId: result.inventoryItemId,
          locationId: selectedLocation,
          newQuantity: parseInt(newQuantity, 10),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to update inventory');
        return;
      }

      setSuccessMessage(data.message);
      // Refresh the product data
      handleLookup(result.barcode || result.sku);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Page 
      title="Scan Barcode"
      backAction={{ content: 'Home', onAction: () => router.push('/app') }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Barcode Scanner
              </Text>
              
              <Text as="p" tone="subdued">
                Use your device camera to scan barcodes, or enter them manually below.
              </Text>

              {!cameraActive && (
                <Button onClick={startCamera} variant="secondary">
                  Start Camera
                </Button>
              )}

              {cameraActive && (
                <BlockStack gap="300">
                  <Box 
                    background="bg-surface-secondary" 
                    borderRadius="200"
                    padding="400"
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: '100%',
                        maxWidth: '600px',
                        borderRadius: '8px',
                        display: 'block',
                        margin: '0 auto',
                      }}
                    />
                  </Box>
                  <InlineStack gap="200">
                    <Button onClick={stopCamera} tone="critical">
                      Stop Camera
                    </Button>
                    <Text as="span" tone="subdued">
                      Note: Automatic barcode detection requires a library. Use manual entry below.
                    </Text>
                  </InlineStack>
                </BlockStack>
              )}

              {cameraError && (
                <Banner tone="warning">
                  {cameraError}
                </Banner>
              )}

              <Divider />

              <Text variant="headingMd" as="h3">
                Manual Entry
              </Text>

              <InlineStack gap="300" align="start">
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Barcode or SKU"
                    value={barcode}
                    onChange={setBarcode}
                    placeholder="Enter or scan barcode"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => handleLookup()}
                  loading={loading}
                >
                  Lookup Product
                </Button>
              </InlineStack>

              {error && (
                <Banner tone="critical" onDismiss={() => setError('')}>
                  {error}
                </Banner>
              )}

              {successMessage && (
                <Banner tone="success" onDismiss={() => setSuccessMessage('')}>
                  {successMessage}
                </Banner>
              )}

              {loading && (
                <Box padding="400">
                  <InlineStack align="center">
                    <Spinner size="small" />
                    <Text as="span">Looking up product...</Text>
                  </InlineStack>
                </Box>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {result && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Product Information
                </Text>
                
                <BlockStack gap="200">
                  <InlineStack gap="200">
                    <Text as="span" fontWeight="semibold">Product:</Text>
                    <Text as="span">{result.productTitle}</Text>
                  </InlineStack>
                  
                  <InlineStack gap="200">
                    <Text as="span" fontWeight="semibold">Variant:</Text>
                    <Text as="span">{result.variantTitle}</Text>
                  </InlineStack>
                  
                  <InlineStack gap="200">
                    <Text as="span" fontWeight="semibold">SKU:</Text>
                    <Text as="span">{result.sku || 'N/A'}</Text>
                  </InlineStack>
                  
                  <InlineStack gap="200">
                    <Text as="span" fontWeight="semibold">Barcode:</Text>
                    <Text as="span">{result.barcode || 'N/A'}</Text>
                  </InlineStack>
                </BlockStack>

                <Divider />

                <Text variant="headingMd" as="h3">
                  Inventory Levels
                </Text>

                {result.inventoryLevels.length === 0 ? (
                  <Banner tone="info">
                    No inventory locations found for this product.
                  </Banner>
                ) : (
                  <BlockStack gap="300">
                    {result.inventoryLevels.map((level) => (
                      <Card key={level.locationId}>
                        <BlockStack gap="200">
                          <InlineStack gap="200" align="space-between">
                            <Text variant="headingSm" as="h4">
                              {level.locationName}
                            </Text>
                            <Text as="span">
                              Available: <strong>{level.available}</strong>
                            </Text>
                          </InlineStack>
                          
                          {selectedLocation === level.locationId && (
                            <InlineStack gap="300" align="start">
                              <div style={{ width: '150px' }}>
                                <TextField
                                  label="New Quantity"
                                  type="number"
                                  value={newQuantity}
                                  onChange={setNewQuantity}
                                  autoComplete="off"
                                />
                              </div>
                              <Button
                                variant="primary"
                                onClick={handleUpdateInventory}
                                loading={updating}
                              >
                                Update Inventory
                              </Button>
                            </InlineStack>
                          )}
                          
                          {selectedLocation !== level.locationId && (
                            <Button
                              onClick={() => {
                                setSelectedLocation(level.locationId);
                                setNewQuantity(level.available.toString());
                              }}
                            >
                              Adjust This Location
                            </Button>
                          )}
                        </BlockStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
