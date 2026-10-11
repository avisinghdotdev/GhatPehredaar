import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";

import "./app.css";

const siteTitle = "Ghat Pehredaar · घाट पहरेदार";
const queryClient = new QueryClient();

export const meta: Route.MetaFunction = () => [
  { title: siteTitle },
  { property: "og:title", content: siteTitle },
  { property: "og:type", content: "website" },
  {
    name: "description",
    content:
      "Which Bhopal ghat needs help before Durga visarjan: MPPCB readings scored against CPCB Class B, every number traced to its report page.",
  },
];

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231f5f5b'/%3E%3Cpath d='M4 13c3-3 5-3 8 0s5 3 8 0 5-3 8 0M4 21c3-3 5-3 8 0s5 3 8 0 5-3 8 0' fill='none' stroke='%23fbf8f1' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E",
  },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap",
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
