// Forces a fixed dark theme with the default orange branding while an
// "auth" screen (Login page, expired-subscription paywall) is on screen.
//
// Why this exists:
//  - A Custom-plan firm can override the app's brand colour at runtime by
//    setting the --brand-* CSS variables on <html> (see brandColor.ts). Those
//    variables are global, so the login/paywall screens would otherwise inherit
//    a previous tenant's custom colour.
//  - The theme toggle (ThemeContext) mutates the global <html>/<body> classes
//    and inline body styles for light mode, which also persists across pages.
//
// This hook snapshots whatever is currently applied, forces dark + orange for
// the lifetime of the component, then restores the exact previous state on
// unmount so the logged-in app keeps the user's real theme and brand colour.

import { useEffect } from 'react';
import { applyBrandColor } from './brandColor';

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export const useAuthScreenTheme = () => {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // ── Snapshot current state ──
    const prevBrand = SHADES.map((s) => root.style.getPropertyValue(`--brand-${s}`));
    const prevHtmlLight = root.classList.contains('light-mode');
    const prevBodyLight = body.classList.contains('light-mode');
    const prevBg = body.style.backgroundColor;
    const prevColor = body.style.color;

    // ── Force dark + default orange ──
    root.classList.remove('light-mode');
    body.classList.remove('light-mode');
    body.style.backgroundColor = '#121212';
    body.style.color = '#ffffff';
    applyBrandColor(null);

    // ── Restore exactly what was there on unmount ──
    return () => {
      SHADES.forEach((s, i) => {
        if (prevBrand[i]) root.style.setProperty(`--brand-${s}`, prevBrand[i]);
      });
      if (prevHtmlLight) root.classList.add('light-mode');
      if (prevBodyLight) body.classList.add('light-mode');
      body.style.backgroundColor = prevBg;
      body.style.color = prevColor;
    };
  }, []);
};
