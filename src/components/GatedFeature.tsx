import React, { useState } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { canAccess, Plan } from '../lib/planUtils';
import UpgradeModal from './UpgradeModal';

interface GatedFeatureProps {
  /** Minimum plan required to use the wrapped feature */
  requiredPlan?: Plan;
  /** Friendly feature name shown in the upgrade modal */
  featureName?: string;
  children: React.ReactNode;
}

/**
 * Wraps an interactive element (e.g. a download button).
 * - The wrapped element stays VISIBLE on every plan.
 * - If the firm's plan meets `requiredPlan`, clicks pass through normally.
 * - Otherwise the click is intercepted and an UpgradeModal is shown.
 */
const GatedFeature: React.FC<GatedFeatureProps> = ({
  requiredPlan = 'pro',
  featureName = 'PDF & receipt downloads',
  children,
}) => {
  const { tenant } = useTenant();
  const [showModal, setShowModal] = useState(false);

  const allowed = canAccess(tenant?.plan, requiredPlan);

  // Allowed → render as-is, clicks work normally
  if (allowed) return <>{children}</>;

  // Not allowed → intercept clicks (capture phase) and show modal
  const handleClickCapture = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      <span onClickCapture={handleClickCapture} className="inline-flex">
        {children}
      </span>
      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        requiredPlan={requiredPlan}
        featureName={featureName}
      />
    </>
  );
};

export default GatedFeature;
