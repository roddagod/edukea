import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type BrandingKind = 'logo' | 'director-signature';

export interface SchoolBranding {
  logo_url: string | null;
  director_signature_url: string | null;
}

export function useSchoolBranding(schoolId: string | undefined) {
  return useQuery<SchoolBranding | null>({
    queryKey: ['school-branding', schoolId],
    enabled: !!schoolId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('logo_url, director_signature_url')
        .eq('id', schoolId!)
        .single();
      if (error) throw error;
      return (data ?? null) as SchoolBranding | null;
    },
  });
}

/**
 * Upload d'un logo ou signature dans le bucket school-branding et met a jour
 * la colonne correspondante sur schools. Cache-buster automatique via ?v=timestamp.
 */
export function useUploadSchoolBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      schoolId,
      kind,
      file,
    }: {
      schoolId: string;
      kind: BrandingKind;
      file: File;
    }): Promise<string> => {
      const ext = (file.name.split('.').pop() ?? 'png').toLowerCase();
      const path = `schools/${schoolId}/${kind}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('school-branding')
        .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('school-branding').getPublicUrl(path);
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

      const column = kind === 'logo' ? 'logo_url' : 'director_signature_url';
      const { error: updErr } = await (supabase.from('schools') as any)
        .update({ [column]: publicUrl })
        .eq('id', schoolId);
      if (updErr) throw updErr;

      return publicUrl;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['school-branding', schoolId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}

export function useRemoveSchoolBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      schoolId,
      kind,
    }: {
      schoolId: string;
      kind: BrandingKind;
    }) => {
      const column = kind === 'logo' ? 'logo_url' : 'director_signature_url';
      const { error } = await (supabase.from('schools') as any)
        .update({ [column]: null })
        .eq('id', schoolId);
      if (error) throw error;
    },
    onSuccess: (_, { schoolId }) => {
      qc.invalidateQueries({ queryKey: ['school-branding', schoolId] });
      qc.invalidateQueries({ queryKey: ['pedagogy-setup-status', schoolId] });
    },
  });
}