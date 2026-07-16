import React, { useEffect } from 'react';
import { useParams, useNavigate } from '@/router';
import { useAuth } from '../contexts/AuthContext';

const ReferralHandler: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (code) {
            localStorage.setItem('referralCode', code);
        }
        if (isAuthenticated) {
            navigate('/', { replace: true });
        } else {
            navigate('/', { replace: true });
        }
    }, [code, navigate, isAuthenticated]);

    return (
        <div className="flex items-center justify-center h-full w-full">
            <div className="w-8 h-8 rounded-full border-2 border-fuchsia-500 border-t-transparent animate-spin" />
        </div>
    );
};

export default ReferralHandler;
