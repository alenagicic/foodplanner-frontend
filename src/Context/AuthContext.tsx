import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type User = {
    name: string;
};

type AuthContextType = {
    user: User | null;
    signIn: (userData: User) => void;
    signOut: () => void;
    isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Attempts to load the user from a token in localStorage on initial load.
     * NOTE: In a production app, you would also validate the token (e.g., check expiry) here.
     */
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');

        if (token && storedUsername) {
            setUser({ name: storedUsername });
        }
        
        setIsLoading(false);
    }, []);

    const signIn = (userData: User) => {
        localStorage.setItem('username', userData.name); 
        setUser(userData);
    };

    const signOut = () => {
        localStorage.removeItem('token'); 
        
        localStorage.removeItem('username'); 

        setUser(null);
    };

    const value = { user, signIn, signOut, isLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};