'use client';

import { useState } from 'react';
import { FormField, Input, SearchInput, Card, Button } from '@edukea/ui';
import { useFamilySearch } from '@edukea/shared';
import type { EnrollmentFormState } from '../_types';

type FamilyRole = 'father' | 'mother' | 'tutor';
type FamilyState = NonNullable<EnrollmentFormState['father']>;

function EmptyFamily(): FamilyState {
  return { firstname: '', lastname: '', phone: '', email: '', job: '', address: '', residence: '' };
}

function FamilyBlock({
  schoolId,
  role,
  label,
  value,
  onChange,
}: {
  schoolId: string | undefined;
  role: FamilyRole;
  label: string;
  value: FamilyState | undefined;
  onChange: (v: FamilyState | undefined) => void;
}) {
  const [query, setQuery] = useState('');
  const { data: results } = useFamilySearch(schoolId, query);
  const active = !!value;

  return (
    <Card className={active ? 'border-primary/40' : ''}>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-heading-sm font-semibold text-ink">{label}</div>
        {active ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            Retirer
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => onChange(EmptyFamily())}>
            Ajouter
          </Button>
        )}
      </div>

      {active && (
        <div className="flex flex-col gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher (nom, téléphone)…"
          />
          {results && results.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {results.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      id: f.id,
                      firstname: f.firstname ?? '',
                      lastname: f.lastname ?? '',
                      phone: f.phone ?? '',
                      email: f.email ?? '',
                      job: '',
                      address: f.address ?? '',
                      residence: '',
                    })
                  }
                  className="flex items-center gap-2 rounded-md border border-line bg-white p-2 text-left text-body-sm hover:border-primary hover:bg-primary/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-ink">{f.lastname} {f.firstname}</div>
                    <div className="text-caption text-ink-3">{f.phone ?? '—'}</div>
                  </div>
                  <span className="text-caption font-semibold text-primary">Utiliser</span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Nom">
              <Input value={value.lastname} onChange={(e) => onChange({ ...value, lastname: e.target.value })} />
            </FormField>
            <FormField label="Prénom">
              <Input value={value.firstname} onChange={(e) => onChange({ ...value, firstname: e.target.value })} />
            </FormField>
            <FormField label="Téléphone" required>
              <Input type="tel" value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} />
            </FormField>
            <FormField label="Profession">
              <Input value={value.job} onChange={(e) => onChange({ ...value, job: e.target.value })} />
            </FormField>
            <FormField label="Résidence (ville)">
              <Input value={value.residence} onChange={(e) => onChange({ ...value, residence: e.target.value })} />
            </FormField>
            <FormField label="Adresse" className="sm:col-span-2">
              <Input value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} />
            </FormField>
          </div>
        </div>
      )}
    </Card>
  );
}

export function StepFamily({
  schoolId,
  value,
  onChange,
}: {
  schoolId: string | undefined;
  value: EnrollmentFormState;
  onChange: (v: EnrollmentFormState) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-ink-3">
        Au moins un des trois blocs (père / mère / tuteur) doit être renseigné avec un téléphone.
      </p>
      <FamilyBlock schoolId={schoolId} role="father" label="Père" value={value.father} onChange={(v) => onChange({ ...value, father: v })} />
      <FamilyBlock schoolId={schoolId} role="mother" label="Mère" value={value.mother} onChange={(v) => onChange({ ...value, mother: v })} />
      <FamilyBlock schoolId={schoolId} role="tutor"  label="Tuteur" value={value.tutor}  onChange={(v) => onChange({ ...value, tutor: v })} />
    </div>
  );
}
