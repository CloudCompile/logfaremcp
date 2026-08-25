import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logfare MCP',
  description: 'Private MCP gateway for Logfare',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
