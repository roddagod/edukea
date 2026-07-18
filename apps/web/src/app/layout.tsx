import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Edukea - Plateforme de gestion scolaire',
  description: 'Edukea simplifie la gestion de votre etablissement scolaire. Suivi des notes, paiements, messagerie et bien plus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
