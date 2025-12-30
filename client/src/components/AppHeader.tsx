import { SidebarTrigger } from "@/components/ui/sidebar";
import ThemeToggle from "./ThemeToggle";
import NotificationCenter from "./NotificationCenter";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background">
      <div className="flex items-center gap-3">
        <SidebarTrigger 
          data-testid="button-sidebar-toggle" 
          className="h-10 w-10 bg-primary/10 border border-primary/20 hover:bg-primary/20 data-[state=open]:bg-primary/20"
        />
        <h1 className="text-lg font-semibold hidden sm:block">FayaFlex</h1>
      </div>
      <div className="flex items-center gap-2">
        <NotificationCenter />
        <ThemeToggle />
      </div>
    </header>
  );
}
