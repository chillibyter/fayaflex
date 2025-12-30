import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Users, PlusCircle, Trophy, User as UserIcon, Activity, LogOut, HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/schema";
import { UserAvatar } from "@/components/UserAvatar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Track Activity", url: "/track", icon: Activity },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "My Teams", url: "/teams", icon: Users },
  { title: "Create Team", url: "/create-team", icon: PlusCircle },
  { title: "Profile", url: "/profile", icon: UserIcon },
  { title: "How It Works", url: "/how-it-works", icon: HelpCircle },
];

export default function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const typedUser = user as User | undefined;

  const userName = typedUser?.firstName && typedUser?.lastName 
    ? `${typedUser.firstName} ${typedUser.lastName}`
    : typedUser?.username || typedUser?.email || 'User';

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b">
        <div className="flex items-center gap-3">
          <img 
            src="/fayaflex-logo.webp" 
            alt="FayaFlex" 
            className="h-10 w-10 rounded-lg"
          />
          <div>
            <h2 className="font-bold text-lg text-primary">FayaFlex</h2>
            <p className="text-xs text-muted-foreground">Fitness Challenge</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t space-y-3">
        <div className="flex items-center gap-3">
          <UserAvatar 
            user={typedUser} 
            className="h-8 w-8"
            iconClassName="h-4 w-4"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{typedUser?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {logoutMutation.isPending ? "Logging out..." : "Log Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
