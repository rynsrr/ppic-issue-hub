import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PPIC Issues — Apple TV Edition',
  description: 'Aplikasi sederhana penampung isu 5 PPIC dengan tampilan bulanan dan pelacak durasi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-black text-[#F5F5F7] min-h-screen selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
