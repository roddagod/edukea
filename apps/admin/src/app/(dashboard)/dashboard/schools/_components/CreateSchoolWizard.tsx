'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createSchoolAtomic } from '../_actions';
import { Copy, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STEPS = ['École', 'Année scolaire', 'Manager (optionnel)'] as const;

export function CreateSchoolWizard({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);

  // Step 1 — school
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
  const [periodeType, setPeriodeType] = useState<'trimestre' | 'semestre'>('trimestre');

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
    const text = `École créée avec succès.\nEmail : ${result.managerEmail}\nMot de passe : ${result.managerPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeAndReset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{result ? 'École créée' : 'Nouvelle école'}</DialogTitle>
          {!result && (
            <DialogDescription>
              Étape {step + 1}/3 — {STEPS[step]}
            </DialogDescription>
          )}
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="font-semibold text-green-900">École et année scolaire créées</p>
              {result.managerEmail && (
                <>
                  <p className="mt-2 text-sm text-green-800">
                    Manager créé. Transmettez ces credentials au manager en main propre :
                  </p>
                  <div className="mt-3 rounded bg-white p-3 font-mono text-sm">
                    <p>Email : {result.managerEmail}</p>
                    <p>Mot de passe : {result.managerPassword}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copyCredentials}
                    className="mt-2 inline-flex items-center gap-2 rounded border border-green-300 bg-white px-3 py-1.5 text-sm hover:bg-green-100"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => { onSuccess(); closeAndReset(); }}>Fermer</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {step === 0 && (
              <div className="grid gap-3">
                <div>
                  <Label>Nom école *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Collège Sainte-Marie"
                  />
                </div>
                <div>
                  <Label>Nom affiché sur bulletins</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ex: Collège Sainte-Marie de Cocody"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Email école</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225…"
                    />
                  </div>
                </div>
                <div>
                  <Label>Adresse physique</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ex: Cocody Rue …"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Adresse postale (BP)</Label>
                    <Input
                      value={postalAddress}
                      onChange={(e) => setPostalAddress(e.target.value)}
                      placeholder="BP 1234 Abidjan"
                    />
                  </div>
                  <div>
                    <Label>N° agrément</Label>
                    <Input
                      value={accreditation}
                      onChange={(e) => setAccreditation(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-3">
                <div>
                  <Label>Nom de l&apos;année *</Label>
                  <Input value={yearName} onChange={(e) => setYearName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date début *</Label>
                    <Input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Date fin *</Label>
                    <Input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Type de période *</Label>
                  <div className="mt-1 flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={periodeType === 'trimestre'}
                        onChange={() => setPeriodeType('trimestre')}
                      />
                      Trimestres (T1/T2/T3)
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={periodeType === 'semestre'}
                        onChange={() => setPeriodeType('semestre')}
                      />
                      Semestres (S1/S2)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createManager}
                    onChange={(e) => setCreateManager(e.target.checked)}
                  />
                  <span className="text-sm">Créer le compte du 1er manager maintenant</span>
                </label>
                {createManager && (
                  <>
                    <div>
                      <Label>Nom d&apos;affichage *</Label>
                      <Input
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="ex: Jean KOFFI"
                      />
                    </div>
                    <div>
                      <Label>Email de connexion *</Label>
                      <Input
                        type="email"
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        placeholder="jean.koffi@ecole.ci"
                      />
                    </div>
                    <div>
                      <Label>Mot de passe temporaire *</Label>
                      <div className="flex gap-2">
                        <Input
                          value={managerPassword}
                          onChange={(e) => setManagerPassword(e.target.value)}
                          placeholder="8 caractères min"
                        />
                        <Button type="button" variant="outline" onClick={generatePassword}>
                          Générer
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>
            )}

            <DialogFooter>
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Précédent
                </Button>
              )}
              {step < 2 && (
                <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
                  Suivant
                </Button>
              )}
              {step === 2 && (
                <Button onClick={handleSubmit} disabled={!canNext() || submitting}>
                  {submitting ? 'Création…' : 'Créer'}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
