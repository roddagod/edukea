import { renderToStream, type DocumentProps } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import type { ReactElement } from 'react';

/**
 * Rend un composant PDF react-pdf en streaming HTTP inline (visualisation
 * navigateur, telechargement possible). Convertit Node Readable -> Web
 * ReadableStream (car Next 15 attend un ReadableStream).
 */
export async function streamPdfResponse(
  element: ReactElement<DocumentProps>,
  filename: string,
): Promise<NextResponse> {
  const nodeStream = await renderToStream(element);

  const webStream = new ReadableStream({
    start(controller) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (nodeStream as any).on('data', (chunk: Buffer) => controller.enqueue(chunk));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (nodeStream as any).on('end', () => controller.close());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (nodeStream as any).on('error', (err: Error) => controller.error(err));
    },
  });

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}

/**
 * Helper : fetch les infos d'une école pour construire un SchoolInfo.
 */
export interface SchoolRow {
  name: string;
  display_name?: string | null;
  logo_url?: string | null;
  address?: string | null;
  postal_address?: string | null;
  phone?: string | null;
  email?: string | null;
  director_signature_url?: string | null;
  country_code?: string | null;
  currency?: string | null;
}

export function schoolRowToInfo(row: SchoolRow) {
  return {
    name: row.name,
    displayName: row.display_name,
    logoUrl: row.logo_url,
    address: row.address,
    postalAddress: row.postal_address,
    phone: row.phone,
    email: row.email,
    directorSignatureUrl: row.director_signature_url,
    countryLabel: row.country_code === 'GA' ? 'Gabon' : "Côte d'Ivoire",
    motto: 'Union-Discipline-Travail',
    currency: (row.currency as 'XOF' | 'XAF') ?? 'XOF',
  };
}
