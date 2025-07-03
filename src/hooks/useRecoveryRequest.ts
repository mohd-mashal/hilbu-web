import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RecoveryRequest = {
  id?: string;
  pickup: string;
  dropoff: string;
  vehicleDetails: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
};

type HistoryItem = {
  id: string;
  pickup: string;
  dropoff: string;
  timestamp: string;
  status: string;
  amount: string;
};

type TripDetail = {
  id: string;
  customerName: string;
  driverName: string;
  pickup: string;
  dropoff: string;
  timestamp: string;
  completedAt: string;
  status: string;
  amount: string;
  paymentMethod: string;
  vehicle: string;
};

export function useRecoveryRequest() {
  const [currentRequest, setCurrentRequest] = useState<RecoveryRequest | null>(null);

  const createRecoveryRequest = async (request: RecoveryRequest) => {
    try {
      const newRequest = {
        ...request,
        id: Math.random().toString(36).substring(2, 9),
      };

      await AsyncStorage.setItem('currentRequest', JSON.stringify(newRequest));
      setCurrentRequest(newRequest);
      return newRequest;
    } catch (error) {
      console.error('Create recovery request error:', error);
      throw error;
    }
  };

  const getCurrentRequest = async () => {
    try {
      const requestStr = await AsyncStorage.getItem('currentRequest');
      if (!requestStr) return null;

      const request = JSON.parse(requestStr);
      setCurrentRequest(request);
      return request;
    } catch (error) {
      console.error('Get current request error:', error);
      return null;
    }
  };

  const cancelRecoveryRequest = async () => {
    try {
      if (currentRequest) {
        const cancelledRequest = {
          ...currentRequest,
          status: 'cancelled' as const,
        };

        const historyStr = await AsyncStorage.getItem('requestHistory');
        const history = historyStr ? JSON.parse(historyStr) : [];
        history.push(cancelledRequest);
        await AsyncStorage.setItem('requestHistory', JSON.stringify(history));

        await AsyncStorage.removeItem('currentRequest');
        setCurrentRequest(null);
      }

      return true;
    } catch (error) {
      console.error('Cancel recovery request error:', error);
      return false;
    }
  };

  const getRecoveryHistory = async (): Promise<HistoryItem[]> => {
    try {
      return [
        {
          id: '1',
          pickup: '123 Main Street, New York, NY',
          dropoff: '456 Park Avenue, New York, NY',
          timestamp: '2025-01-15T14:30:00Z',
          status: 'completed',
          amount: 'AED 17.50',
        },
        {
          id: '2',
          pickup: '789 Broadway, New York, NY',
          dropoff: '101 Fifth Avenue, New York, NY',
          timestamp: '2025-01-10T09:15:00Z',
          status: 'cancelled',
          amount: 'AED 0.00',
        },
        {
          id: '3',
          pickup: '202 West Street, New York, NY',
          dropoff: '303 East Street, New York, NY',
          timestamp: '2025-01-05T18:45:00Z',
          status: 'completed',
          amount: 'AED 22.75',
        },
      ];
    } catch (error) {
      console.error('Get recovery history error:', error);
      return [];
    }
  };

  const getTripDetails = async (tripId: string): Promise<TripDetail> => {
    return {
      id: tripId,
      customerName: 'John Smith',
      driverName: 'Mike Driver',
      pickup: '123 Main Street, New York, NY',
      dropoff: '456 Park Avenue, New York, NY',
      timestamp: '2025-01-15T14:30:00Z',
      completedAt: '2025-01-15T15:15:00Z',
      status: 'completed',
      amount: 'AED 17.50',
      paymentMethod: 'Visa **** 4242',
      vehicle: 'Toyota Tundra - Recovery Truck',
    };
  };

  return {
    currentRequest,
    createRecoveryRequest,
    getCurrentRequest,
    cancelRecoveryRequest,
    getRecoveryHistory,
    getTripDetails,
  };
}