import React, { useState, useEffect } from 'react';
import * as Purchases from 'react-native-purchases';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// RevenueCat Configuration
const REVENUE_CAT_API_KEY = 'pk_test_51RCPzyFzPn99KThOwPJFVwtNkB7bBQ8s51cqh217zLTd175jnaT2pQCz80HrP0FHSpuw0RKFtvZ9UOIa5wJlZhm700MP2nZ21F';
const MONTHLY_PACKAGE_ID = 'monthly_pro';
const ANNUAL_PACKAGE_ID = 'annual_pro';

type PaywallProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess?: () => void;
};

const Paywall: React.FC<PaywallProps> = ({ isOpen, onClose, onUpgradeSuccess }) => {
  const [packages, setPackages] = useState<Purchases.Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        // Configure RevenueCat
        Purchases.default.configure({ 
          apiKey: REVENUE_CAT_API_KEY,
          // Add platform-specific app ID if needed
        });

        // Fetch available packages
        const offerings = await Purchases.default.getOfferings();
        if (offerings.current?.availablePackages) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (error) {
        console.error('RevenueCat initialization error:', error);
      }
    };

    if (isOpen) {
      initializeRevenueCat();
    }
  }, [isOpen]);

  const handlePurchase = async (pkg: Purchases.Package) => {
    setIsLoading(true);
    try {
      const { customerInfo } = await Purchases.default.purchasePackage(pkg);
      
      // Check if purchase was successful
      if (customerInfo.entitlements.active['pro']) {
        onUpgradeSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upgrade to PeekDiet Pro</DialogTitle>
          <DialogDescription>
            Unlock advanced features and insights to optimize your glucose tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {packages.map((pkg) => (
            <Button 
              key={pkg.identifier}
              onClick={() => handlePurchase(pkg)}
              disabled={isLoading}
              className="w-full"
            >
              {pkg.packageType === 'monthly' 
                ? `Monthly - ${pkg.product.priceString}` 
                : `Annual - ${pkg.product.priceString}`}
            </Button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center mt-4">
          Payment will be charged to your Apple/Google account. 
          Subscription auto-renews unless canceled.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Paywall;
