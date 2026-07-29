'use client';

import { useEffect, useState } from 'react';
import { supabase, useUpdateSchoolBareme } from '@edukea/shared';
import { Skeleton } from '@edukea/ui';

interface Props { schoolId: string; }

const OPTIONS = [10, 20, 100] as const;

export function GradingChooser({ schoolId }: Props) {
  const [current, setCurrent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const update = useUpdateSchoolBareme();

  useEffect(() => {
    supabase
      .from('schools')
      .select('default_max_score')
      .eq('id', schoolId)
      .single()
      .then(({ data }) => {
        setCurrent((data as { default_max_score: number } | null)?.default_max_score ?? 20);
        setLoading(false);
      });
  }, [schoolId]);

  if (loading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((v) => (
          <button
            key={v}
            onClick={() => { setCurrent(v); update.mutate({ schoolId, maxScore: v }); }}
            className={`rounded-xl border-2 p-6 text-center transition ${
              current === v ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-3xl font-bold text-slate-900">/{v}</div>
            <div className="mt-1 text-xs text-slate-500">Notation sur {v}</div>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Modifier le barème n&apos;impacte pas les évaluations déjà saisies. Le nouveau barème s&apos;appliquera aux nouvelles évaluations.
      </p>
    </div>
  );
}
