"use client";

import { ThemeProviderWrapper } from "./theme-provider";



export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProviderWrapper>
        {children}
    </ThemeProviderWrapper>
  );
}