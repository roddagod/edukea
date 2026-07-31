import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Edukea - Plateforme de gestion scolaire ivoirienne',
  description: 'Edukea simplifie la gestion scolaire en Afrique. Inscriptions, paiements, bulletins, communication parents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
