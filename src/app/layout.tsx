import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Atticus Rebuild — Book Writing & Formatting',
  description: 'Write, format, and export professional books. Free alternative to Atticus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
