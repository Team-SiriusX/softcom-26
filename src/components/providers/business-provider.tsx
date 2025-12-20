"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface BusinessContextType {
  selectedBusinessId: string | null;
  setSelectedBusinessId: (id: string | null) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null
  );

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("selectedBusinessId");
    if (saved) {
      setSelectedBusinessId(saved);
    } else {
      // Initialize localStorage with null if it doesn't exist
      localStorage.setItem("selectedBusinessId", "null");
    }
  }, []);

  // Save to localStorage when changed
  const handleSetSelectedBusinessId = (id: string | null) => {
    setSelectedBusinessId(id);
    if (id) {
      localStorage.setItem("selectedBusinessId", id);
    } else {
      localStorage.setItem("selectedBusinessId", "null");
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        selectedBusinessId,
        setSelectedBusinessId: handleSetSelectedBusinessId,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useSelectedBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error(
      "useSelectedBusiness must be used within a BusinessProvider"
    );
  }
  return context;
}
