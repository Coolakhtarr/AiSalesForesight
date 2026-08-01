import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({
  children,
  orgName = "Your Store",
  plan = "trial",
}: {
  children: React.ReactNode;
  orgName?: string;
  plan?: "trial" | "basic" | "pro" | "enterprise";
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar orgName={orgName} plan={plan} />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
