import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PPIC Issue Tracker — Apple TV Edition',
  description: 'Pusat Manajemen & Pemantauan Isu Harian 5 PPIC dengan Tampilan Bulanan & Realtime Aging Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-tv-bg text-tv-textPrimary min-h-screen selection:bg-tv-accent selection:text-white">
        {/* Subtle Ambient Background Lighting (Apple TV cinematic backdrop) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="ambient-orb absolute -top-40 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="ambient-orb absolute top-1/3 -right-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
          <div className="ambient-orb absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-amber-600/8 rounded-full blur-[150px]" />
        </div>
        <div className="relative z-10 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
