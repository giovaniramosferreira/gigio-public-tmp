"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  FileText,
  Clapperboard,
  CheckCircle,
  Package,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/ideas", label: "Ideias", icon: Lightbulb },
  { href: "/scripts", label: "Roteiros", icon: FileText },
  { href: "/production", label: "Produção", icon: Clapperboard },
  { href: "/review", label: "Revisão", icon: CheckCircle },
  { href: "/export", label: "Exportar", icon: Package },
  { href: "/analytics", label: "Análises", icon: BarChart3 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-6 p-4">
      <Link href="/" className="flex items-center gap-2 px-2 py-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Clapperboard className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">
          DarkTube <span className="text-primary">OS</span>
        </span>
      </Link>

      <ul className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
