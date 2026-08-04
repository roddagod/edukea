import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase-server';
import { ArrowLeft } from 'lucide-react';
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

  // Recupere aussi school_id du level (pas du context) : garantit que les
  // student_types affiches correspondent bien a l'ecole proprietaire du niveau
  // (important quand un superadmin navigue entre plusieurs ecoles).
  const { data: level } = await supabase
    .from('levels')
    .select('id, name, cycle:cycles(school_id)')
    .eq('id', levelId)
    .maybeSingle();

  if (!level) redirect('/dashboard/pedagogy/fees');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const l = level as any;
  const levelName = l.name as string;
  const levelSchoolId = (l.cycle?.school_id ?? l.cycles?.school_id) as string | undefined;
  if (!levelSchoolId) redirect('/dashboard/pedagogy/fees');

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <a href="/dashboard/pedagogy/fees" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-orange-600">
            <ArrowLeft className="h-3 w-3" /> Retour à la matrice frais
          </a>
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Frais du niveau {levelName}</h1>
          <p className="text-sm text-slate-600">
            Configurez les lignes de frais et le calendrier d&apos;échéances pour chaque type d&apos;élève.
          </p>
        </div>
      </div>
      <FeeLevelEditor
        schoolId={levelSchoolId}
        levelId={levelId}
        initialTypeId={initialTypeId}
      />
    </div>
  );
}
