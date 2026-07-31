export const dynamic = 'force-dynamic';

import ClientLayout from './_client-layout';

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
