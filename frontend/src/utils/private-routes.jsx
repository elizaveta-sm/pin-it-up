import { useSelector } from 'react-redux';
import { Outlet, Navigate } from 'react-router-dom';
import { selectCurrentUser } from '../store/user/user.slice';

const PrivateRoutes = () => {
    const currentUser = useSelector(selectCurrentUser);

    return currentUser ? <Outlet /> : <Navigate to='/sign-in'/>;
}

export default PrivateRoutes;