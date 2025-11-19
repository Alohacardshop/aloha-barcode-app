"use client";

import { ReactNode } from "react";
import { AppProvider } from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import "@shopify/polaris/build/esm/styles.css";

interface ProvidersProps {
  children: ReactNode;
  shop?: string;
  host?: string;
}

export function Providers({ children, shop, host }: ProvidersProps) {
  const config = shop && host ? {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '',
    host: host,
    forceRedirect: true,
  } : undefined;

  return (
    <AppProvider i18n={{}}>
      {config ? (
        <AppBridgeProvider config={config}>
          {children}
        </AppBridgeProvider>
      ) : (
        children
      )}
    </AppProvider>
  );
}
