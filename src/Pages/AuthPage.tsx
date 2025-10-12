import React, { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { createAccount, SigninAccount, type Account } from "../Utils/api"; 

interface AuthFormData {
    username: string;
    password: string;
    confirmPassword?: string;
}

interface AuthFormErrors {
    username?: string;
    password?: string;
    confirmPassword?: string;
    apiError?: string; 
}

type AuthMode = 'signIn' | 'signUp';

export default function AuthPage() {
    const context = useContext(AuthContext);
    const navigate = useNavigate();

    const inputRefs = {
        username: useRef<HTMLInputElement>(null),
        password: useRef<HTMLInputElement>(null),
        confirmPassword: useRef<HTMLInputElement>(null),
    };
    
    if (!context) {
        throw new Error("AuthPage must be used within an AuthContext.Provider");
    }
    const { signIn } = context; 

    const [formData, setFormData] = useState<AuthFormData>({
        username: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<AuthFormErrors>({});
    const [mode, setMode] = useState<AuthMode>('signIn');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        inputRefs.username.current?.focus(); 
    }, [mode]); 

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [mode]); 

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;

    const validateField = (name: keyof AuthFormData, value: string): string | undefined => {
        let error: string | undefined = undefined;

        switch (name) {
            case 'username':
                if (!value) {
                    error = "Användarnamn/E-post måste anges.";
                } else if (!emailPattern.test(value)) {
                    error = "Måste vara en giltig E-post address.";
                }
                break;
            case 'password':
                if (!value) {
                    error = "Lösenord måste anges.";
                } else if (!passwordPattern.test(value)) {
                    error = "Min 8 bokstäver, 1 stor, 1 siffra, 1 special.";
                }
                break;
            case 'confirmPassword':
                if (mode === 'signUp' && value !== formData.password) {
                    error = "Lösenorden matchar ej";
                } else if (mode === 'signUp' && !value) {
                    error = "Nödvändigt att bekräfta lösenord";
                }
                break;
            default:
                break;
        }

        return error;
    };

    const validateForm = (): boolean => {
        const newErrors: AuthFormErrors = {};
        
        newErrors.username = validateField('username', formData.username);
        newErrors.password = validateField('password', formData.password);

        if (mode === 'signUp') {
            newErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword || '');
        }

        const filteredErrors: AuthFormErrors = Object.fromEntries(
            Object.entries(newErrors).filter(([_, v]) => v)
        );

        setErrors(prevErrors => ({ ...prevErrors, ...filteredErrors, apiError: undefined }));
        return Object.keys(filteredErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const fieldName = name as keyof AuthFormData;
        
        setFormData(prevData => ({
            ...prevData,
            [fieldName]: value,
        }));

        const error = validateField(fieldName, value);
        setErrors(prevErrors => ({
            ...prevErrors,
            [fieldName]: error,
            apiError: undefined,
        }));

        if (fieldName === 'password' && mode === 'signUp') {
            const confirmError = validateField('confirmPassword', formData.confirmPassword || '');
            setErrors(prevErrors => ({
                ...prevErrors,
                confirmPassword: confirmError,
            }));
        }
    };
    
    const toggleMode = () => {
        setFormData({ username: '', password: '', confirmPassword: '' });
        setErrors({});
        setMode(prevMode => prevMode === 'signIn' ? 'signUp' : 'signIn'); 
    };

    const handleSignIn = async () => {
        try {
            const account: Omit<Account, 'id'> = {
                username: formData.username,
                Password: formData.password, 
            };
            
            const token = await SigninAccount(account);

            if (token) {
                localStorage.setItem('token', token);
                signIn({ name: formData.username }); 
                navigate("/");
            } else {
                setErrors(prev => ({ 
                    ...prev, 
                    apiError: "Inloggning misslyckades. Kontrollera användarnamn/lösenord.",
                }));
            }
        } catch (error) {
            setErrors(prev => ({ 
                ...prev, 
                apiError: "Nätverksfel uppstod vid inloggning. Försök igen senare.",
            }));
        }
    };

    const handleSignUp = async () => {
        try {
            const newAccount: Omit<Account, 'id'> = {
                username: formData.username,
                Password: formData.password, 
            };
            
            const token = await createAccount(newAccount);

            if (token) {
                localStorage.setItem('token', token);
                signIn({ name: formData.username }); 
                navigate("/");
            } else {
                setErrors(prev => ({ 
                    ...prev, 
                    apiError: "Account creation failed. Please check your details or try again.",
                }));
            }
        } catch (error) {
            setErrors(prev => ({ 
                ...prev, 
                apiError: "A network error occurred. Please try again later.",
            }));
        }
    }

    const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); 
        setErrors({});
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        if (mode === 'signIn') {
            await handleSignIn();
        } else {
            await handleSignUp();
        }
        
        setIsSubmitting(false);
    };

    const isSignIn = mode === 'signIn';
    const titleText = isSignIn ? "Logga in" : "Registrera dig";
    const buttonText = isSignIn ? (isSubmitting ? "Loggar in..." : "Logga in") : (isSubmitting ? "Skapar konto..." : "Skapa konto");
    const switchLinkText = isSignIn ? "Registrera" : "Logga in";

    return (
        <div className="wrapper-page wrapper-auth">
            <h2>
                {titleText}
            </h2>
            
            {errors.apiError && <p className="validation-error api-error">{errors.apiError}</p>}

            <form onSubmit={handleAuthSubmit}>
                <div>
                    <label htmlFor="username">E-post</label>
                    <input 
                        ref={inputRefs.username}
                        name="username"
                        id="username"
                        type="text" 
                        value={formData.username}
                        onChange={handleChange}
                        onFocus={handleInputFocus}
                        required
                        disabled={isSubmitting}
                        placeholder="Mata in E-post"
                    />
                    {errors.username && <p className="validation-error">{errors.username}</p>}
                </div>
            
                <div>
                    <label htmlFor="password">Lösenord</label>
                    <input 
                        ref={inputRefs.password}
                        name="password"
                        id="password"
                        type="password" 
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={handleInputFocus}
                        required
                        disabled={isSubmitting}
                        placeholder="Mata in Lösenord"
                    />
                    {errors.password && <p className="validation-error">{errors.password}</p>}
                </div>

                {!isSignIn && (
                    <div>
                        <label htmlFor="confirmPassword">Bekräfta Lösenord</label>
                        <input 
                            ref={inputRefs.confirmPassword}
                            name="confirmPassword"
                            id="confirmPassword"
                            type="password" 
                            value={formData.confirmPassword || ''}
                            onChange={handleChange}
                            onFocus={handleInputFocus}
                            required
                            disabled={isSubmitting}
                            placeholder="Mata in Lösenord Igen"
                        />
                        {errors.confirmPassword && <p className="validation-error">{errors.confirmPassword}</p>}
                    </div>
                )}

                <button type="submit" disabled={isSubmitting}>
                    {buttonText}
                </button>
            </form>

            <button onClick={toggleMode}>
                {switchLinkText}
            </button>
        </div>
    );
}