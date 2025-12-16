import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';

const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const isAuth = isAuthenticated();
  
  if (!isAuth) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
