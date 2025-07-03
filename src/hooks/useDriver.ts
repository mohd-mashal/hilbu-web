import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RecoveryRequest = {
  id: string;
  customerName: string;
  pickup: string;
  dropoff: string;
  timestamp: string;
  vehicle: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
};

export function useDriver() {
  const [driverInfo, setDriverInfo] = useState({
    name: 'John Driver',
    vehicle: 'Toyota Tundra - Recovery Truck',
    rating: 4.8,
    isOnline: true,
  });
  
  const getRecoveryRequests = async (): Promise<RecoveryRequest[]> => {
    try {
      // In a real app, this would fetch from an API
      // For now, return mock data
      return [
        {
          id: '101',
          customerName: 'Alex Smith',
          pickup: '123 Main Street, New York, NY',
          dropoff: '456 Park Avenue, New York, NY',
          timestamp: new Date().toISOString(),
          vehicle: 'BMW X5, Black',
          status: 'pending',
        },
        {
          id: '102',
          customerName: 'Sarah Johnson',
          pickup: '789 Broadway, New York, NY',
          dropoff: '',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          vehicle: 'Toyota Camry, Silver',
          status: 'pending',
        },
      ];
    } catch (error) {
      console.error('Get recovery requests error:', error);
      return [];
    }
  };
  
  const acceptRequest = async (requestId: string) => {
    try {
      // In a real app, this would update the backend
      // For now, just store locally
      const acceptedRequest = {
        id: requestId,
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('driverCurrentJob', JSON.stringify(acceptedRequest));
      return true;
    } catch (error) {
      console.error('Accept request error:', error);
      return false;
    }
  };
  
  const rejectRequest = async (requestId: string) => {
    try {
      // In a real app, this would update the backend
      return true;
    } catch (error) {
      console.error('Reject request error:', error);
      return false;
    }
  };
  
  const completeRequest = async (requestId: string) => {
    try {
      // In a real app, this would update the backend
      await AsyncStorage.removeItem('driverCurrentJob');
      return true;
    } catch (error) {
      console.error('Complete request error:', error);
      return false;
    }
  };
  
  const getCurrentJob = async () => {
    try {
      const jobStr = await AsyncStorage.getItem('driverCurrentJob');
      if (!jobStr) return null;
      
      return JSON.parse(jobStr);
    } catch (error) {
      console.error('Get current job error:', error);
      return null;
    }
  };
  
  const toggleOnlineStatus = () => {
    setDriverInfo(prev => ({
      ...prev,
      isOnline: !prev.isOnline,
    }));
    return driverInfo.isOnline;
  };
  
  return {
    driverInfo,
    getRecoveryRequests,
    acceptRequest,
    rejectRequest,
    completeRequest,
    getCurrentJob,
    toggleOnlineStatus,
  };
}