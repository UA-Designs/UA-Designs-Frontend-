import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { User, LoginRequest, RegisterRequest, AuthState } from '../types';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { AccessLevel, hasAccess } from '../lib/rbac';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  /** Check if the current user meets a given access level. */
  can: (level: AccessLevel) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = authService.getToken();
        const storedUser = authService.getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setIsAuthenticated(true);

          // Verify token with backend
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            authService.removeToken();
            authService.removeUser();
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        authService.removeToken();
        authService.removeUser();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);

      setUser(response.data.user);
      setToken(response.data.token);
      setIsAuthenticated(true);

      toast.success('Login successful!');
    } catch (error: any) {
      const message = error.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);

      setUser(response.data.user);
      setToken(response.data.token);
      setIsAuthenticated(true);

      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // ignore logout errors
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error('No authenticated user');
      // Normalize: handle backends that return _id instead of id
      const userId = user.id ?? (user as any)._id;
      if (!userId) throw new Error('User ID is missing — please log out and log in again.');
      const updatedUser = await authService.updateUser(userId, data);
      // Merge: preserve all existing fields, overlay the submitted changes,
      // then overlay whatever the backend returned — always keep the known id.
      const mergedUser = { ...user, ...data, ...updatedUser, id: updatedUser.id ?? userId };
      setUser(mergedUser);
      authService.setUser(mergedUser);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(msg);
      throw error;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Password change failed';
      toast.error(msg);
      throw error;
    }
  };

  const can = useCallback(
    (level: AccessLevel): boolean => hasAccess(user?.role, level),
    [user?.role],
  );

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    can,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
