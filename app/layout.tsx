import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PPIC Issue Tracker',
  description: 'Minimalist issue tracking for 5 PPIC units with monthly calendar view and live duration tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-[#F5F5F7] min-h-screen selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
