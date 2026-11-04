import { applicationMode } from '@/lib/mode';
import type { Metadata } from 'next';
import './globals.css';
import { ReportProvider } from '@/components/report-provider';
// Resolve mode per request; never bake local/demo UI into a static page.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'ReportFlow — Business clarity, beautifully delivered',
  description:
    'An interactive business reporting portfolio demo with fictional sales data.',
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ReportProvider mode={applicationMode()}>{children}</ReportProvider>
      </body>
    </html>
  );
}
