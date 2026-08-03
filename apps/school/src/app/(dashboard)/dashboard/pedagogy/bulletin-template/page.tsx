import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase-server';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const metadata = { title: 'Personnalisation bulletin — Rentrée' };

interface PageProps {
  searchParams: Promise<{ school?: string }>;
}

export default async function BulletinTemplatePage({ searchParams }: PageProps) {
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
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <a href="/dashboard/pedagogy" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-orange-600">
            <ArrowLeft className="h-3 w-3" /> Retour au Hub Rentrée
          </a>
          <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Personnalisation bulletin</h1>
          <p className="text-sm text-slate-600">
            Chargez votre logo, signatures et cachet pour personnaliser les bulletins émis.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <Sparkles className="h-6 w-6 text-orange-600" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Bientôt disponible</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          L&apos;upload du logo, des signatures du directeur et du cachet arrive dans un prochain sprint.
          Cette étape restera <span className="font-semibold">facultative</span> ; les bulletins fonctionneront sans.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          École : {ctx.current_school.name}
        </p>
      </div>
    </div>
  );
}
