import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from './LoginForm';
import { Card, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-4 p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-lg font-medium">Carregando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginForm />;
  }

  if (requiredRole && profile.role?.name !== requiredRole && profile.role?.name !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <Card className="card-elevated max-w-md">
          <CardContent className="text-center p-8">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta área.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}