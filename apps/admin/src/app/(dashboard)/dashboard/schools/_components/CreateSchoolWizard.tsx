'use client';

import { useState } from 'react';
import { Button, Input, Modal } from '@edukea/ui';
import { createSchoolAtomic } from '../_actions';
import { Copy, Check } from 'lucide-react';
import { COUNTRIES, type CountryCode } from '@edukea/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ['Ecole', 'Annee scolaire', 'Manager (optionnel)'] as const;

export function CreateSchoolWizard({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);

  // Step 1 — school
  const [countryCode, setCountryCode] = useState<CountryCode>('CI');
  const country = COUNTRIES[countryCode];
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postalAddress, setPostalAddress] = useState('');
  const [accreditation, setAccreditation] = useState('');

  // Step 2 — year
  const currentYear = new Date().getFullYear();
  const [yearName, setYearName] = useState(`${currentYear}-${currentYear + 1}`);
  const [dateStart, setDateStart] = useState(`${currentYear}-09-01`);
  const [dateEnd, setDateEnd] = useState(`${currentYear + 1}-06-30`);
  const [periodeType, setPeriodeType] = useState<'trimestre' | 'semestre' | null>(null);

  // Step 3 — manager
  const [createManager, setCreateManager] = useState(true);
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    schoolId: string;
    managerEmail?: string;
    managerPassword?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setManagerPassword(pw);
  };

  const canNext = () => {
    if (step === 0) return !!name.trim();
    if (step === 1) return !!yearName && !!dateStart && !!dateEnd && dateEnd > dateStart;
    if (step === 2)
      return !createManager || (!!managerName && !!managerEmail && managerPassword.length >= 8);
    return false;
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const res = await createSchoolAtomic({
      name: name.trim(),
      displayName: displayName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      postalAddress: postalAddress || undefined,
      accreditationNumber: accreditation || undefined,
      countryCode,
      currency: country.currency,
      year: { name: yearName, dateStart, dateEnd, periodeType },
      manager: createManager
        ? { email: managerEmail, password: managerPassword, displayName: managerName }
        : undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? 'Erreur');
      return;
    }
    setResult({
      schoolId: res.schoolId!,
      managerEmail: createManager ? managerEmail : undefined,
      managerPassword: createManager ? managerPassword : undefined,
    });
  };

  const reset = () => {
    setStep(0);
    setName('');
    setDisplayName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPostalAddress('');
    setAccreditation('');
    setYearName(`${currentYear}-${currentYear + 1}`);
    setDateStart(`${currentYear}-09-01`);
    setDateEnd(`${currentYear + 1}-06-30`);
    setPeriodeType('trimestre');
    setCreateManager(true);
    setManagerName('');
    setManagerEmail('');
    setManagerPassword('');
    setSubmitting(false);
    setError(null);
    setResult(null);
    setCopied(false);
  };

  const closeAndReset = () => {
    reset();
    onClose();
  };

  const copyCredentials = () => {
    if (!result) return;
    const text = `Ecole creee avec succes.\nEmail : ${result.managerEmail}\nMot de passe : ${result.managerPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const footer = result ? (
    <Button variant="accent" onClick={() => { onSuccess(); closeAndReset(); }}>
      Fermer
    </Button>
  ) : (
    <>
      {step > 0 && (
        <Button variant="secondary" onClick={() => setStep(step - 1)}>
          Precedent
        </Button>
      )}
      {step < 2 && (
        <Button variant="accent" onClick={() => setStep(step + 1)} disabled={!canNext()}>
          Suivant
        </Button>
      )}
      {step === 2 && (
        <Button
          variant="accent"
          onClick={handleSubmit}
          disabled={!canNext() || submitting}
        >
          {submitting ? 'Creation...' : 'Creer'}
        </Button>
      )}
    </>
  );

  return (
    <Modal
      open={open}
      onClose={closeAndReset}
      size="lg"
      title={result ? "Ecole creee" : "Nouvelle ecole"}
      description={
        !result
          ? `Etape ${step + 1}/3 — ${STEPS[step]}`
          : undefined
      }
      footer={footer}
    >
      {result ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <p className="font-semibold text-success">Ecole et annee scolaire creees</p>
            {result.managerEmail && (
              <>
                <p className="mt-2 text-sm text-success/80">
                  Manager cree. Transmettez ces credentials au manager en main propre :
                </p>
                <div className="mt-3 rounded bg-white p-3 font-mono text-sm border border-line">
                  <p>Email : {result.managerEmail}</p>
                  <p>Mot de passe : {result.managerPassword}</p>
                </div>
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="mt-2 inline-flex items-center gap-2 rounded border border-success/30 bg-white px-3 py-1.5 text-sm hover:bg-success/5 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copie' : 'Copier'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {step === 0 && (
            <div className="grid gap-3">
              <div>
                <p className="mb-1 text-body-xs font-semibold text-ink-2">Pays *</p>
                <div className="flex gap-2">
                  {Object.values(COUNTRIES).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCountryCode(c.code)}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        countryCode === c.code
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-line text-ink-2 hover:border-primary/40'
                      }`}
                    >
                      {c.label}
                      <span className="ml-2 text-xs text-ink-3">
                        {c.currency} · +{c.phonePrefix}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Nom ecole *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: College Sainte-Marie"
              />
              <Input
                label="Nom affiche sur bulletins"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ex: College Sainte-Marie de Cocody"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email ecole"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Telephone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={`+${country.phonePrefix}...`}
                />
              </div>
              <Input
                label="Adresse physique"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Cocody Rue ..."
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Adresse postale (BP)"
                  value={postalAddress}
                  onChange={(e) => setPostalAddress(e.target.value)}
                  placeholder="BP 1234 Abidjan"
                />
                <Input
                  label="N° agrement"
                  value={accreditation}
                  onChange={(e) => setAccreditation(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-3">
              <Input
                label="Nom de l'annee *"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Date debut *"
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
                <Input
                  label="Date fin *"
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-body-xs font-semibold text-ink-2">Type de periode</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-ink-2">
                    <input
                      type="radio"
                      checked={periodeType === 'trimestre'}
                      onChange={() => setPeriodeType('trimestre')}
                    />
                    Trimestres (T1/T2/T3)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-2">
                    <input
                      type="radio"
                      checked={periodeType === 'semestre'}
                      onChange={() => setPeriodeType('semestre')}
                    />
                    Semestres (S1/S2)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-2">
                    <input
                      type="radio"
                      checked={periodeType === null}
                      onChange={() => setPeriodeType(null)}
                    />
                    Aucun (definir plus tard)
                  </label>
                </div>
                <p className="mt-1 text-xs text-ink-3">
                  Les ecoles primaires peuvent laisser vide et configurer plus tard.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-2">
                <input
                  type="checkbox"
                  checked={createManager}
                  onChange={(e) => setCreateManager(e.target.checked)}
                />
                Creer le compte du 1er manager maintenant
              </label>
              {createManager && (
                <>
                  <Input
                    label="Nom d'affichage *"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="ex: Jean KOFFI"
                  />
                  <Input
                    label="Email de connexion *"
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="jean.koffi@ecole.ci"
                  />
                  <div>
                    <p className="mb-1.5 text-body-xs font-semibold text-ink-2">
                      Mot de passe temporaire *
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={managerPassword}
                        onChange={(e) => setManagerPassword(e.target.value)}
                        placeholder="8 caracteres min"
                      />
                      <Button type="button" variant="secondary" onClick={generatePassword}>
                        Generer
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <div className="rounded bg-destructive/5 p-2 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
