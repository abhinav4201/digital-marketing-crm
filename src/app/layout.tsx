import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script"; // Import the Script component
import { AuthProvider } from "./providers/AuthProvider";
import Navbar from "./components/ui/Navbar";
import Footer from "./components/ui/Footer";
import PageWrapper from "./components/animations/PageWrapper";
import ContactModal from "./components/ui/ContactModal";
import InfoModal from "./components/ui/InfoModal";

export const metadata: Metadata = {
  title: {
    template: "%s | Royal Screen",
    default: "Royal Screen - Your one-stop for digital solutions.",
  },
  description: "Your one-stop for digital solutions.",
  openGraph: {
    title: "Royal Screen",
    description: "Your one-stop for digital solutions.",
    url: "https://royal-screen.vercel.app/", // Replace with your actual domain
    siteName: "Royal Screen",
    images: [
      {
        url: "https://royal-screen.vercel.app//og-image.png", // Replace with your OG image URL
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const GTM_ID = "GTM-XXXXXXX"; // Replace with your GTM ID

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <Script id='google-tag-manager' strategy='afterInteractive'>
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
      </head>
      <body className='bg-[var(--background-light)] text-[var(--text-primary-light)]'>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height='0'
            width='0'
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <AuthProvider>
          <Navbar />
          <ContactModal />
          <InfoModal />
          <PageWrapper>
            <main>{children}</main>
          </PageWrapper>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
