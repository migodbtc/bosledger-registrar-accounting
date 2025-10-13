import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <BrowserRouter>
        <SidebarProvider>{ui}</SidebarProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export * from "@testing-library/react";
