'use client';

import { useState, useEffect } from 'react';
import { Save, Shield } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      await (supabase
        .from('admin_profiles') as any)
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
      <div>
        <h1 className="text-2xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">Parametres du compte administrateur</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil administrateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={session?.user.email ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Nom d&apos;affichage</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div>
                <Badge variant="outline">
                  <Shield className="mr-1.5 h-3 w-3" />
                  {profile?.role === 'superadmin' ? 'Super Administrateur' : 'Administrateur'}
                </Badge>
              </div>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Enregistrement...' : saved ? 'Enregistre !' : 'Enregistrer'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations systeme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">ID utilisateur</p>
              <p className="text-sm font-mono">{session?.user.id ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ID profil</p>
              <p className="text-sm font-mono">{profile?.id ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date de creation</p>
              <p className="text-sm">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
