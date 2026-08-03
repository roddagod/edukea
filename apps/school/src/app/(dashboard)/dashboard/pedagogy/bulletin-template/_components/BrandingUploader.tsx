'use client';

import { useRef, useState } from 'react';
import {
  useSchoolBranding,
  useUploadSchoolBranding,
  useRemoveSchoolBranding,
  type BrandingKind,
} from '@edukea/shared';
import { Button } from '@edukea/ui';
import { Upload, Trash2, ImageIcon } from 'lucide-react';

interface Props {
  schoolId: string;
}

const KINDS: Array<{ key: BrandingKind; title: string; hint: string }> = [
  {
    key: 'logo',
    title: 'Logo de l\'ecole',
    hint: 'PNG, JPG, WebP ou SVG. 2 Mo max. Idealement carre 512x512 minimum.',
  },
  {
    key: 'director-signature',
    title: 'Signature du directeur',
    hint: 'Image avec fond transparent (PNG). Sera imprimee sur les bulletins.',
  },
];

export function BrandingUploader({ schoolId }: Props) {
  const { data: branding, isLoading } = useSchoolBranding(schoolId);
  const upload = useUploadSchoolBranding();
  const remove = useRemoveSchoolBranding();

  if (isLoading) {
    return <div className="h-64 w-full animate-pulse rounded-xl bg-slate-100" />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {KINDS.map((k) => (
        <BrandingCard
          key={k.key}
          schoolId={schoolId}
          kind={k.key}
          title={k.title}
          hint={k.hint}
          currentUrl={k.key === 'logo' ? branding?.logo_url : branding?.director_signature_url}
          onUpload={(file) => upload.mutateAsync({ schoolId, kind: k.key, file })}
          onRemove={() => remove.mutateAsync({ schoolId, kind: k.key })}
          uploading={upload.isPending}
          removing={remove.isPending}
        />
      ))}
    </div>
  );
}

function BrandingCard({
  kind,
  title,
  hint,
  currentUrl,
  onUpload,
  onRemove,
  uploading,
  removing,
}: {
  schoolId: string;
  kind: BrandingKind;
  title: string;
  hint: string;
  currentUrl: string | null | undefined;
  onUpload: (file: File) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  uploading: boolean;
  removing: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setError(null);
    if (file.size > 2 * 1024 * 1024) {
      setError('Fichier trop volumineux (2 Mo max).');
      return;
    }
    try {
      await onUpload(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur upload');
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>

      <div className="mt-4 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={title} className="max-h-full max-w-full object-contain p-2" />
        ) : (
          <div className="text-center text-slate-400">
            <ImageIcon className="mx-auto h-8 w-8" />
            <p className="mt-1 text-xs">Aucun fichier</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          variant="accent"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {currentUrl ? 'Remplacer' : 'Televerser'}
        </Button>
        {currentUrl && (
          <Button
            variant="ghost"
            onClick={async () => {
              if (!confirm(`Supprimer ${title.toLowerCase()} ?`)) return;
              setError(null);
              try {
                await onRemove();
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Erreur suppression');
              }
            }}
            disabled={removing}
          >
            <Trash2 className="mr-2 h-4 w-4 text-red-500" /> Supprimer
          </Button>
        )}
      </div>

      {(uploading || removing) && (
        <p className="mt-2 text-xs text-slate-500">Enregistrement…</p>
      )}
      {error && (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-400">
        {kind === 'logo'
          ? 'Le logo apparait sur les recus PDF, bulletins et listes officielles.'
          : 'La signature est ajoutee sous le nom du directeur sur les bulletins.'}
      </p>
    </div>
  );
}
