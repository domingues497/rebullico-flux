import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "PDV", href: "/pos", icon: ShoppingCart },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Grupos", href: "/product-groups", icon: Layers },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "flex flex-col h-full bg-primary text-primary-foreground transition-all duration-300",
      collapsed ? "w-16" : "w-60",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-light">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/339d4cd0-28b4-4574-87db-c57426893347.png" 
              alt="Rebulliço" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-xl font-semibold">Rebulliço</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-primary-foreground hover:bg-primary-light"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-light text-primary-foreground"
                  : "text-primary-foreground/80 hover:bg-primary-light/50 hover:text-primary-foreground",
                collapsed ? "justify-center" : "justify-start"
              )}
            >
              <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-light">
        {!collapsed && (
          <div className="text-xs text-primary-foreground/60">
            Sistema Rebulliço v1.0
          </div>
        )}
      </div>
    </div>
  );
}