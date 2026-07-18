'use client';

import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <p className="text-muted-foreground">Gestion des abonnements des etablissements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abonnements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Module en cours de developpement</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              La gestion des abonnements sera bientot disponible.
              Vous pourrez gerer les plans, les factures et les paiements des etablissements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
