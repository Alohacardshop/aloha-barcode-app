import { Page, Card, Layout, Text } from '@shopify/polaris';

export default function Dashboard() {
  return (
    <Page title="Barcode Label Printer">
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">
              Welcome to Aloha Barcode App
            </Text>
            <Text as="p">
              Design custom labels and print barcodes for your Shopify products.
            </Text>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

