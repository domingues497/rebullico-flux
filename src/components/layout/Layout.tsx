import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Capacitor } from "@capacitor/core";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Layout({ children, title, className }: LayoutProps) {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // Layout simplificado para mobile/POS - sem sidebar, apenas header (ou nem isso se preferir)
    return (
      <div className="flex h-screen bg-background flex-col">
        {/* Header simplificado ou removido dependendo do requisito. Manter Header por enquanto */}
        <Header title={title} />
        <main className={`flex-1 overflow-y-auto p-4 ${className}`}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className={`flex-1 overflow-y-auto p-6 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  );
}