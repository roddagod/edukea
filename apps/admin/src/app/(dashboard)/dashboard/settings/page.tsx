'use client';

import { useState, useEffect } from 'react';
import { Save, Shield } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createClient } from '@/lib/supabase-browser';
import { Button, Input, Card, CardHeader, CardTitle, Badge, PageHeader } from '@edukea/ui';

export default function SettingsPage() {
  const { session, profile } = useAdminAuth();
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      await (supabase.from('admin_profiles') as any)
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration"
        sub="Parametres du compte administrateur"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil administrateur</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input label="Email" value={session?.user.email ?? ''} disabled />
            <Input
              label="Nom d'affichage"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Votre nom"
            />
            <div>
              <p className="mb-1.5 text-body-xs font-semibold text-ink-2">Role</p>
              <Badge tone="neutral">
                <Shield className="mr-1.5 h-3 w-3" />
                {profile?.role === 'superadmin' ? 'Super Administrateur' : 'Administrateur'}
              </Badge>
            </div>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Enregistrement...' : saved ? 'Enregistre !' : 'Enregistrer'}
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations systeme</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-ink-3">ID utilisateur</p>
              <p className="font-mono text-sm text-ink">{session?.user.id ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-3">ID profil</p>
              <p className="font-mono text-sm text-ink">{profile?.id ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-3">Date de creation</p>
              <p className="text-sm text-ink">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
