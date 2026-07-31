'use client';

import { CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, PageHeader } from '@edukea/ui';

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonnements"
        sub="Gestion des abonnements des etablissements"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abonnements</CardTitle>
        </CardHeader>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-ink">Module en cours de developpement</h3>
          <p className="mt-2 max-w-md text-sm text-ink-3">
            La gestion des abonnements sera bientot disponible. Vous pourrez gerer les plans,
            les factures et les paiements des etablissements.
          </p>
        </div>
      </Card>
    </div>
  );
}
