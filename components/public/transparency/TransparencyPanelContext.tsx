"use client";

// ---------------------------------------------------------------------
// components/public/transparency/TransparencyPanelContext.tsx — tiny
// client context sharing the desktop transparency drawer's open state
// between the drawer (PublicTransparencyFrame) and the dashboard content
// column (PublicContentColumn). Closed by default so the dashboard loads
// clean; the content column drops its lg:mr-[360px] reservation while the
// drawer is hidden so the dashboard uses the full width.
// ---------------------------------------------------------------------

import { createContext, useContext, useState, type ReactNode } from "react";

type TransparencyPanelState = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const TransparencyPanelContext = createContext<TransparencyPanelState>({
  isOpen: false,
  setOpen: () => {},
});

export function TransparencyPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <TransparencyPanelContext.Provider value={{ isOpen, setOpen: setIsOpen }}>
      {children}
    </TransparencyPanelContext.Provider>
  );
}

export function useTransparencyPanel() {
  return useContext(TransparencyPanelContext);
}
