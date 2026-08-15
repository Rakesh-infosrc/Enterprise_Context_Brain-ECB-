import './globals.css';
import Header from '@/components/common/Header';
import Sidebar from '@/components/common/Sidebar';

export const metadata = {
  title: 'Enterprise Context Brain',
  description: 'Governed Organizational Memory & Agentic Decision Intelligence Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-gray-100 min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
