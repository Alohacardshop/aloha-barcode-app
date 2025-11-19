"use client";

import { ReactNode, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Providers } from "./providers";

export function ClientLayout({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [shop, setShop] = useState<string | undefined>();
  const [host, setHost] = useState<string | undefined>();

  useEffect(() => {
    setShop(searchParams.get('shop') || undefined);
    setHost(searchParams.get('host') || undefined);
  }, [searchParams]);

  return <Providers shop={shop} host={host}>{children}</Providers>;
}

