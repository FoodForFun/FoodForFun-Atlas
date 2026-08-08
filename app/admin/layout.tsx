export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-route-shell">{children}</div>;
}
