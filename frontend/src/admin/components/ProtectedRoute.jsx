import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../api/client';
import { getStoredUser } from '../api/auth';

export default function ProtectedRoute({ children }) {
    const location = useLocation();
    const token = getToken();
    const user = getStoredUser();

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (user && user.role !== 'admin' && user.role !== 'root') {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}
