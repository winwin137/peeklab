import { useState, useEffect } from 'react';
import * as Purchases from 'react-native-purchases';

export const usePurchases = () => {
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        // Configure RevenueCat
        Purchases.default.configure({ 
          apiKey: 'pk_test_51RCPzyFzPn99KThOwPJFVwtNkB7bBQ8s51cqh217zLTd175jnaT2pQCz80HrP0FHSpuw0RKFtvZ9UOIa5wJlZhm700MP2nZ21F',
          // Add platform-specific app ID if needed
        });

        const customerInfo = await Purchases.default.getCustomerInfo();
        setIsProUser(!!customerInfo.entitlements.active['pro']);
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
        setIsProUser(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRevenueCat();

    // Listen for purchase updates
    const purchaseListener = Purchases.default.addCustomerInfoUpdateListener(
      (customerInfo) => {
        setIsProUser(!!customerInfo.entitlements.active['pro']);
      }
    );

    return () => {
      purchaseListener.remove();
    };
  }, []);

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.default.restorePurchases();
      setIsProUser(!!customerInfo.entitlements.active['pro']);
      return customerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return null;
    }
  };

  return {
    isProUser,
    isLoading,
    restorePurchases
  };
};
