import type { Metadata } from 'next';
import './globals.css';
import './site.css';
import './vietnam.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SiteHeader, SiteFooter } from '@/components/SiteChrome';
import { SITE_URL } from '@/lib/site';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Tử Vi Việt', template: '%s · Tử Vi Việt' },
  description: 'Lập lá số Tử Vi và tìm hiểu các sao, cung bằng tiếng Việt.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Tử Vi Việt',
    description: 'Lập lá số Tử Vi bằng tiếng Việt',
    url: SITE_URL,
    siteName: 'Tử Vi Việt',
    locale: 'vi_VN',
    type: 'website',
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');document.documentElement.setAttribute('data-theme',t==='light'||t==='dark'?t:'dark')}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
