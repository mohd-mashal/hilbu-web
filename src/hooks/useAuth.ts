import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserInfo = {
  name: string;
  email: string;
  phone: string;
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  const login = async (phoneNumber: string) => {
    // In a real app, this would call the authentication API
    try {
      // Simulate successful authentication
      const userData = {
        phone: phoneNumber,
        name: '',
        email: '',
      };
      
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setUserInfo(userData);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  const register = async (name: string, email: string) => {
    try {
      // Get the existing user data
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return false;
      
      const user = JSON.parse(userStr);
      
      // Update with new info
      const updatedUser = {
        ...user,
        name,
        email,
      };
      
      // Store updated user data
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUserInfo(updatedUser);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };
  
  const logout = async () => {
    try {
      // Remove user data from storage
      await AsyncStorage.removeItem('user');
      
      setUserInfo(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };
  
  const verifyOtp = (phoneNumber: string, otp: string) => {
    // In a real app, this would verify the OTP with the backend
    // For now, we'll just simulate success
    return otp === '123456';
  };
  
  const getUserInfo = async (): Promise<UserInfo | null> => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      setUserInfo(user);
      return user;
    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  };
  
  return {
    isAuthenticated,
    userInfo,
    login,
    register,
    logout,
    verifyOtp,
    getUserInfo,
  };
}