"use client";

import { ThemeProviderWrapper } from "./theme-provider";
import AuthBootstrap from "./auth-bootstrap";



export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProviderWrapper>
      <AuthBootstrap />
      {children}
    </ThemeProviderWrapper>
  );
}