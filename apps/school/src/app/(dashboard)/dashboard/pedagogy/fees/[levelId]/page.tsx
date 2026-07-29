import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { FeeLevelEditor } from './_components/FeeLevelEditor';

export const metadata = { title: 'Édition frais niveau — Rentrée' };

interface PageProps {
  params: Promise<{ levelId: string }>;
  searchParams: Promise<{ school?: string; type?: string }>;
}

export default async function FeeLevelPage({ params, searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { levelId } = await params;
  const { school: requestedSchoolId, type: initialTypeId } = await searchParams;

  const { data: ctxRaw } = await (supabase.rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)('get_user_school_context', {
    p_requested_school_id: requestedSchoolId ?? null,
    p_requested_year_id: null,
  });
  const ctx = ctxRaw as { current_school: { id: string; name: string } | null } | null;
  if (!ctx?.current_school) redirect('/dashboard');

  const { data: level } = await supabase
    .from('levels')
    .select('id, name')
    .eq('id', levelId)
    .maybeSingle();

  if (!level) redirect('/dashboard/pedagogy/fees');

  const levelName = (level as { name: string }).name;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <a href="/dashboard/pedagogy/fees" className="text-xs text-slate-500 hover:text-orange-600">
        ← Retour à la matrice frais
      </a>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Frais du niveau {levelName}</h1>
        <p className="text-sm text-slate-600">
          Configurez les lignes de frais et le calendrier d&apos;échéances pour chaque type d&apos;élève.
        </p>
      </div>
      <FeeLevelEditor
        schoolId={ctx.current_school.id}
        levelId={levelId}
        initialTypeId={initialTypeId}
      />
    </div>
  );
}
