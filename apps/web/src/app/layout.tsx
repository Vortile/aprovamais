import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = "https://aprovamais.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aprova+ | Aulas Particulares em Manaus — Física e Matemática",
    template: "%s | Aprova+",
  },
  description:
    "Aulas particulares presenciais em Manaus de Física, Matemática e Inglês para o Ensino Fundamental e Médio. Professor formado em Física, atendimento a domicílio. Primeira aula grátis.",
  keywords: [
    "aulas particulares Manaus",
    "professor particular Manaus",
    "reforço escolar Manaus",
    "aulas de física Manaus",
    "aulas de matemática Manaus",
    "aulas de inglês Manaus",
    "aulas a domicílio Manaus",
    "professor de física Manaus",
    "reforço Ensino Médio Manaus",
    "reforço Ensino Fundamental Manaus",
    "vestibular Manaus",
    "Aprova+",
    "aprovamais",
  ],
  authors: [{ name: "Deuticilam Gomes Maia Júnior" }],
  creator: "Deuticilam Gomes Maia Júnior",
  publisher: "Aprova+",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Aprova+",
    title: "Aprova+ | Aulas Particulares em Manaus — Física e Matemática",
    description:
      "Aulas particulares presenciais em Manaus de Física, Matemática e Inglês. Professor formado em Física, atendimento a domicílio. Primeira aula grátis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aprova+ — Aulas Particulares em Manaus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aprova+ | Aulas Particulares em Manaus",
    description:
      "Física, Matemática e Inglês a domicílio em Manaus. Primeira aula grátis.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "COLE_SEU_CÓDIGO_AQUI",  // ← descomente e cole o código do Google Search Console
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": siteUrl,
  name: "Aprova+",
  description:
    "Aulas particulares presenciais de Física, Matemática e Inglês em Manaus, AM. Atendimento a domicílio para Ensino Fundamental e Médio.",
  url: siteUrl,
  telephone: "+5592981581955",
  email: "",
  founder: {
    "@type": "Person",
    name: "Deuticilam Gomes Maia Júnior",
    jobTitle: "Professor Particular",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Manaus",
    addressRegion: "AM",
    addressCountry: "BR",
  },
  areaServed: {
    "@type": "City",
    name: "Manaus",
  },
  knowsAbout: [
    "Física",
    "Matemática",
    "Inglês",
    "Ensino Fundamental",
    "Ensino Médio",
  ],
  priceRange: "R$650 – R$1.300/mês",
  openingHours: "Mo-Sa 07:00-21:00",
  sameAs: [
    "https://instagram.com/aprovamais_educ",
    `https://wa.me/5592981581955`,
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`scroll-smooth ${manrope.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
        {children}
      </body>
    </html>
  );
}
