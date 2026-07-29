import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { GradingChooser } from './_components/GradingChooser';

export const metadata = { title: 'Barème école — Rentrée' };

interface PageProps {
  searchParams: Promise<{ school?: string }>;
}

export default async function GradingPage({ searchParams }: PageProps) {
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
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <a href="/dashboard/pedagogy" className="text-xs text-slate-500 hover:text-orange-600">← Retour au Hub Rentrée</a>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Barème école</h1>
        <p className="text-sm text-slate-600">
          Choisissez le barème de notation utilisé par l&apos;école.
        </p>
      </div>
      <GradingChooser schoolId={ctx.current_school.id} />
    </div>
  );
}
