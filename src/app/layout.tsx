import type { Metadata } from "next";
import { Exo_2, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo2",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://asteria-club-esprit.vercel.app"),
  title: {
    default: "Asteria Club Esprit — Premier Student Studio & Talent Incubator",
    template: "%s | Asteria Club Esprit",
  },
  description:
    "Where ESPRIT's top creators in Web Development, Graphic Design, Video Editing, and Photography build real projects and graduate into paid commercial client contracts at Asteria Freelance PreLaunch.",
  keywords: [
    "Asteria Club",
    "Asteria Club Esprit",
    "ESPRIT University",
    "Web Development",
    "Graphic Design",
    "Video Editing",
    "Photography",
    "Student Creative Studio",
    "Asteria Freelance PreLaunch",
    "Tunisia Student Incubator",
  ],
  authors: [{ name: "Asteria Club Esprit" }],
  creator: "Asteria Club Esprit",
  publisher: "Asteria Club Esprit",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://asteria-club-esprit.vercel.app",
    siteName: "Asteria Club Esprit",
    title: "Asteria Club Esprit — Learn. Create. Connect.",
    description:
      "Empowering students at ESPRIT to master digital crafts, build production projects, and earn paid freelance contracts.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Asteria Club Esprit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Asteria Club Esprit — Premier Student Creative & Tech Studio",
    description:
      "Where ESPRIT's top creators in Web Development, Graphic Design, Video Editing, and Photography are launched.",
    images: ["/logo.png"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`h-full light ${exo2.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#F4F8F9] dark:bg-[#062327] text-ink dark:text-white font-body antialiased flex flex-col selection:bg-teal-400 selection:text-ink transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
