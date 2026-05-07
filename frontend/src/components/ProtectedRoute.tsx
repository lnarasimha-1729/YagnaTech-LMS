// import { ReactNode } from 'react';
// import { Navigate } from 'react-router-dom';
// import { useAuth } from '@/hooks/useAuth';

// interface ProtectedRouteProps {
//   children: ReactNode;
// }

// const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
//   const { user, loading } = useAuth();

//   console.log('ProtectedRoute - User:', user, 'Loading:', loading);

//   if (loading) {
//     console.log('ProtectedRoute - Showing loading spinner');
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   if (!user) {
//     console.log('ProtectedRoute - No user, redirecting to login');
//     return <Navigate to="/login" replace />;
//   }

//   console.log('ProtectedRoute - User authenticated, rendering children');
//   return <>{children}</>;
// };

// export default ProtectedRoute;
// components/ProtectedRoute.tsx

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, checkAuth } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    if (hasCheckedAuth || user || loading) return;
    (async () => {
      try { await checkAuth(); } finally { setHasCheckedAuth(true); }
    })();
    // checkAuth intentionally omitted: AuthProvider recreates it on every
    // render, so including it would cause an infinite re-render loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCheckedAuth, user, loading]);

  if (loading || (!hasCheckedAuth && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;