import "./globals.css";
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { AuthProvider } from "./providers/AuthProvider";
import Navbar from "./components/ui/Navbar";
import Footer from "./components/ui/Footer";
import PageWrapper from "./components/animations/PageWrapper";
import ContactModal from "./components/ui/ContactModal"; // Import the new modal
import InfoModal from "./components/ui/InfoModal";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Digital Agency",
  description: "Your one-stop for digital solutions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className='bg-[var(--background-light)] text-[var(--text-primary-light)]'>
        <AuthProvider>
          <Navbar />
          <ContactModal /> {/* Add the modal component here */}
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
