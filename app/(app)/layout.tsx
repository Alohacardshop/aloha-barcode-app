'use client';

import { Frame, Navigation } from '@shopify/polaris';
import { HomeMajor, ProductsMajor } from '@shopify/polaris-icons';
import { usePathname } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            label: 'Dashboard',
            icon: HomeMajor,
            url: '/app',
            matches: pathname === '/app',
          },
          {
            label: 'Products',
            icon: ProductsMajor,
            url: '/app/products',
            matches: pathname === '/app/products',
          },
          {
            label: 'Label Designer',
            icon: ProductsMajor,
            url: '/app/designer',
            matches: pathname === '/app/designer',
          },
        ]}
      />
    </Navigation>
  );

  return (
    <Frame navigation={navigationMarkup}>
      {children}
    </Frame>
  );
}

