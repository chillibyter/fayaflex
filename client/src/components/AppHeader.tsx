import { SidebarTrigger } from "@/components/ui/sidebar";
import ThemeToggle from "./ThemeToggle";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background">
      <div className="flex items-center gap-3">
        <SidebarTrigger 
          data-testid="button-sidebar-toggle" 
          className="h-10 w-10 bg-primary/10 border border-primary/20 hover:bg-primary/20 data-[state=open]:bg-primary/20"
        />
        <h1 className="text-lg font-semibold hidden sm:block">UFC Dashboard</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          <Badge className="absolute top-1 right-1 h-2 w-2 p-0" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
