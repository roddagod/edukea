'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, UserCheck } from 'lucide-react';
import {
  FormField, Input, Checkbox, DatePicker, RadioCards, SearchInput,
  Card, Avatar, toneFromSeed,
} from '@edukea/ui';
import { useStudentSearch, useStudentTypes } from '@edukea/shared';
import type { EnrollmentFormState } from '../_types';

export function StepStudent({
  schoolId,
  qsSuffix,
  value,
  onChange,
  typeStudentId,
  onTypeStudentChange,
}: {
  schoolId: string | undefined;
  qsSuffix: string;
  value: EnrollmentFormState['student'];
  onChange: (v: EnrollmentFormState['student']) => void;
  typeStudentId: string | undefined;
  onTypeStudentChange: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const { data: results } = useStudentSearch(schoolId, query);
  const { data: studentTypes } = useStudentTypes(schoolId);

  // Auto-sélectionner le type par défaut (is_default=true, sinon le premier)
  useEffect(() => {
    if (typeStudentId || !studentTypes?.length) return;
    const defaultType = studentTypes.find((t) => t.is_default) ?? studentTypes[0];
    if (defaultType) onTypeStudentChange(defaultType.id);
  }, [studentTypes, typeStudentId, onTypeStudentChange]);

  return (
    <div className="flex flex-col gap-5">
      <Card className="bg-primary/[0.03]">
        <div className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-primary">
          <Search className="h-4 w-4" /> Vérifier si l'élève existe déjà
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="Nom, prénom, matricule…" />
        {results && results.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {results.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/enrollment/re/${s.id}${qsSuffix}`}
                className="flex items-center gap-3 rounded-md border border-line bg-white p-3 hover:border-primary hover:bg-primary/[0.04]"
              >
                <Avatar
                  initials={`${(s.lastname ?? '?')[0] ?? ''}${(s.firstname ?? '?')[0] ?? ''}`.toUpperCase()}
                  tone={toneFromSeed(s.id)}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{s.lastname} {s.firstname}</div>
                  {s.matricule && <div className="text-caption text-ink-3">Matr. {s.matricule}</div>}
                </div>
                <div className="text-body-xs font-semibold text-primary">Réinscrire →</div>
              </Link>
            ))}
          </div>
        )}
        {results && query.length >= 2 && results.length === 0 && (
          <div className="mt-2 flex items-center gap-2 text-body-xs text-ink-3">
            <UserCheck className="h-4 w-4" /> Aucun élève existant — continuer la création ci-dessous
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nom" required>
          <Input value={value.lastname} onChange={(e) => onChange({ ...value, lastname: e.target.value })} />
        </FormField>
        <FormField label="Prénom(s)" required>
          <Input value={value.firstname} onChange={(e) => onChange({ ...value, firstname: e.target.value })} />
        </FormField>
        <FormField label="Sexe" required>
          <RadioCards
            name="sex"
            columns={2}
            options={[
              { value: 'M', label: 'Masculin' },
              { value: 'F', label: 'Féminin' },
            ]}
            value={value.sex || undefined}
            onChange={(v) => onChange({ ...value, sex: v as 'M' | 'F' })}
          />
        </FormField>
        <FormField label="Type d'élève" required>
          <select
            value={typeStudentId ?? ''}
            onChange={(e) => onTypeStudentChange(e.target.value)}
            required
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {(studentTypes ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Date de naissance" required>
          <DatePicker value={value.birthdate} onChange={(e) => onChange({ ...value, birthdate: e.target.value })} />
        </FormField>
        <FormField label="Lieu de naissance">
          <Input value={value.birthplace} onChange={(e) => onChange({ ...value, birthplace: e.target.value })} />
        </FormField>
        <FormField label="Nationalité">
          <Input value={value.nationality} onChange={(e) => onChange({ ...value, nationality: e.target.value })} />
        </FormField>
      </div>

      <Checkbox
        checked={value.redoublant}
        onChange={(e) => onChange({ ...value, redoublant: e.target.checked })}
        label="Élève redoublant"
        hint="Cocher si l'élève reprend la même classe qu'à l'année N-1"
      />
    </div>
  );
}
