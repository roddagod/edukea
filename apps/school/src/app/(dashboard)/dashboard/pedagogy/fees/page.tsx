import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { ArrowLeft } from 'lucide-react';
import { FeesOverviewMatrix } from './_components/FeesOverviewMatrix';

export const metadata = { title: 'Frais scolarité — Rentrée' };

interface PageProps {
  searchParams: Promise<{ school?: string }>;
}

export default async function FeesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { school: requestedSchoolId } = await searchParams;

  const { data: ctxRaw } = await (supabase.rpc as unknown as (
    fn: string, args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)('get_user_school_context', {
    p_requested_school_id: requestedSchoolId ?? null,
    p_requested_year_id: null,
  });

  const ctx = ctxRaw as { current_school: { id: string; name: string } | null } | null;
  if (!ctx?.current_school) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <a href="/dashboard/pedagogy" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-orange-600">
            <ArrowLeft className="h-3 w-3" /> Retour au Hub Rentrée
          </a>
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Frais scolarité</h1>
          <p className="text-sm text-slate-600">
            Configurez les frais pour chaque combinaison niveau × type d&apos;élève. Cliquez une cellule pour éditer.
          </p>
        </div>
      </div>
      <FeesOverviewMatrix schoolId={ctx.current_school.id} />
    </div>
  );
}
