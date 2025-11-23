// Server component wrapper for admin layout - allows route segment config
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

import AdminLayoutClient from './layout-client';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

