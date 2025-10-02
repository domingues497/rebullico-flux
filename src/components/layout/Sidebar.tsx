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
  { name: "Dashboard", href: "/admin", icon: Home },
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
  const [collapsed, setCollapsed] = useState(true); // Inicia recolhido
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();

  // Determina se deve mostrar expandido (hover ou não collapsed)
  const isExpanded = !collapsed || isHovered;

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-primary text-primary-foreground sidebar-hover",
        isExpanded ? "w-60" : "w-16",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-light">
        {isExpanded && (
          <div className={cn(
            "flex items-center space-x-3 sidebar-text-fade",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            <img 
              src="/lovable-uploads/339d4cd0-28b4-4574-87db-c57426893347.png" 
              alt="Rebulliço" 
              className="w-8 h-8 object-contain sidebar-icon"
            />
            <h1 className="text-xl font-semibold whitespace-nowrap">Rebulliço</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-primary-foreground hover:bg-primary-light shrink-0 sidebar-icon"
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
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
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium sidebar-hover",
                isActive
                  ? "bg-primary-light text-primary-foreground"
                  : "text-primary-foreground/80 hover:bg-primary-light/50 hover:text-primary-foreground",
                isExpanded ? "justify-start" : "justify-center"
              )}
              title={!isExpanded ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0 sidebar-icon", isExpanded && "mr-3")} />
              {isExpanded && (
                <span className={cn(
                  "whitespace-nowrap sidebar-text-fade",
                  isExpanded ? "opacity-100" : "opacity-0"
                )}>
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-light">
        {isExpanded && (
          <div className={cn(
            "text-xs text-primary-foreground/60 sidebar-text-fade",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            Sistema Rebulliço v1.0
          </div>
        )}
      </div>
    </div>
  );
}