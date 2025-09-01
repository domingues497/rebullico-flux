import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Layout({ children, title, className }: LayoutProps) {
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