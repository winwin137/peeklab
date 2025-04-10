import { useState, useEffect } from 'react';
import Purchases from 'react-native-purchases';

export const usePurchases = () => {
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        setIsProUser(!!customerInfo.entitlements.active['pro']);
      } catch (error) {
        console.error('Error checking purchase status:', error);
        setIsProUser(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPurchaseStatus();

    // Listen for purchase updates
    const purchaseListener = Purchases.addCustomerInfoUpdateListener(
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
      const customerInfo = await Purchases.restorePurchases();
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
