/**
 * Auth Context - Manages authentication state across the app.
 * Provides login, logout, and current user information.
 * Updated to use modern Apollo Client patterns (no deprecated callbacks).
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../graphql/queries';
import { LOGIN, CREATE_USER } from '../graphql/mutations';
import { setAuthToken, clearAuth } from '../graphql/client';
import type { AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: true,
  });

  // Use lazy query without deprecated callbacks
  const [fetchMe, { data: meData, error: meError, called }] = useLazyQuery(GET_ME, {
    fetchPolicy: 'network-only',
  });

  const [loginMutation] = useMutation(LOGIN);
  const [signupMutation] = useMutation(CREATE_USER);

  // Handle fetchMe results with useEffect
  useEffect(() => {
    if (!called) return;
    
    if (meData?.me) {
      setState((prev) => ({
        ...prev,
        user: meData.me,
        isAuthenticated: true,
        isLoading: false,
      }));
    } else if (meError) {
      clearAuth();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } else if (meData && !meData.me) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [meData, meError, called]);

  // Check auth on mount
  useEffect(() => {
    if (state.token) {
      fetchMe();
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await loginMutation({
      variables: { email, password },
    });

    if (data?.tokenAuth?.token) {
      const token = data.tokenAuth.token;
      setAuthToken(token);
      setState((prev) => ({ ...prev, token, isLoading: true }));
      
      // Fetch user after login
      const result = await fetchMe();
      if (result.data?.me) {
        setState((prev) => ({
          ...prev,
          user: result.data.me,
          isAuthenticated: true,
          isLoading: false,
        }));
      }
    } else {
      throw new Error('Login failed - no token received');
    }
  }, [loginMutation, fetchMe]);

  const signup = useCallback(async (email: string, password: string, fullName?: string) => {
    const { data } = await signupMutation({
      variables: { email, password, fullName },
    });

    if (data?.createUser?.success) {
      // Auto-login after signup
      await login(email, password);
    } else {
      throw new Error(data?.createUser?.message || 'Signup failed');
    }
  }, [signupMutation, login]);

  const logout = useCallback(() => {
    clearAuth();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
