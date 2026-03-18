"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const roleLabels: Record<string, string> = {
    admin: "Quản trị viên",
    teacher: "Giáo viên",
    student: "Học sinh",
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden mr-4 p-2 hover:bg-muted rounded-md"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground">{user ? roleLabels[user.role] : ""}</p>
          </div>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-background shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              onClick={() => { setShowMenu(false); logout(); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
