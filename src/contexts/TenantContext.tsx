import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { applyBrandColor } from '../lib/brandColor';
import { Tenant, TenantBranding, TenantAddon } from '../types';

interface TenantContextType {
  tenant: Tenant | null;
  branding: TenantBranding | null;
  addons: TenantAddon[];
  isExpired: boolean;
  isTrialing: boolean;
  daysLeftInTrial: number;
  hasAddon: (addon: string) => boolean;
  refreshTenant: () => Promise<void>;
  applyBranding: (b: TenantBranding) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode; tenantId?: string }> = ({
  children,
  tenantId,
}) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [addons, setAddons] = useState<TenantAddon[]>([]);

  const applyBranding = (b: TenantBranding) => {
    // Only re-skin the app when white label is actually active (Custom plan).
    // Otherwise keep the standard orange theme.
    if (b?.white_label_active && b?.primary_color) {
      document.documentElement.style.setProperty('--color-primary', b.primary_color);
      applyBrandColor(b.primary_color);
    } else {
      applyBrandColor(null); // reset to default orange
    }
  };

  const fetchTenant = async () => {
    if (!tenantId) return;

    const { data: t } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    if (t) setTenant(t as Tenant);

    const { data: b } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    if (b) {
      setBranding(b as TenantBranding);
      applyBranding(b as TenantBranding);
    } else {
      applyBrandColor(null); // no branding row → standard orange theme
    }

    const { data: a } = await supabase
      .from('tenant_addons')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    if (a) setAddons(a as TenantAddon[]);
  };

  const isExpired = (() => {
    if (!tenant) return false;
    const status = tenant.subscription_status;
    const plan = tenant.plan;
    const trialEnd = tenant.trial_ends_at;
    // Paid plan that expired or was cancelled
    if (status === 'expired' || status === 'cancelled') return true;
    // Still on trial — check the actual date
    if (plan === 'trial' && trialEnd) {
      const trialEndDate = new Date(trialEnd);
      trialEndDate.setHours(23, 59, 59, 999);
      return new Date() > trialEndDate;
    }
    return false;
  })();
  const isTrialing = tenant?.plan === 'trial';
  const daysLeftInTrial = tenant?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(tenant.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const hasAddon = (addon: string) =>
    addons.some((a) => a.addon === addon && a.is_active);

  useEffect(() => {
    fetchTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        branding,
        addons,
        isExpired,
        isTrialing,
        daysLeftInTrial,
        hasAddon,
        refreshTenant: fetchTenant,
        applyBranding,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be inside TenantProvider');
  return ctx;
};
