import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

// Shows an install hint so users know VakilDesk can be added to their phone.
//  - Android / desktop Chrome: uses the native `beforeinstallprompt` event and
//    shows an "Install App" button that triggers the browser install dialog.
//  - iOS Safari: no install event exists, so we show short "Add to Home Screen"
//    instructions instead.
// The banner hides itself once installed or after the user dismisses it.

const DISMISS_KEY = 'pwaInstallDismissed';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari exposes navigator.standalone
  (window.navigator as any).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already installed — nothing to do
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    // Android / Chrome install flow
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Hide the banner if the app gets installed
    const onInstalled = () => {
      setShow(false);
      setShowIosHint(false);
    };
    window.addEventListener('appinstalled', onInstalled);

    // iOS never fires beforeinstallprompt — show manual instructions instead
    if (isIos() && !isStandalone()) {
      setShowIosHint(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    setShowIosHint(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show && !showIosHint) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] w-[calc(100%-1.5rem)] max-w-md px-3">
      <div className="rounded-2xl border border-orange-500/30 bg-[#1a1a2e] shadow-2xl p-4 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
          <img src="/logo.svg" alt="VakilDesk" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Install VakilDesk</p>

          {show ? (
            <>
              <p className="text-gray-400 text-xs mt-0.5">
                Add it to your device to open it like a normal app — full screen, one tap away.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-xl"
                >
                  <Download size={16} /> Install App
                </button>
                <button onClick={dismiss} className="text-gray-400 hover:text-white text-sm px-2 py-2">
                  Not now
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              Tap the <Share size={13} className="inline -mt-0.5 text-orange-400" /> Share button in
              Safari, then choose <span className="text-white font-medium">“Add to Home Screen”</span> to
              install VakilDesk.
            </p>
          )}
        </div>

        <button onClick={dismiss} className="text-gray-500 hover:text-white flex-shrink-0 p-1">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
