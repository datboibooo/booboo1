import { Sidebar } from "@/components/layout/sidebar";
import { MagicCommandBar } from "@/components/magic/command-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[--background]">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
      <MagicCommandBar />
    </div>
  );
}
