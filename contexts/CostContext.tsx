"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CostContextType {
  totalCost: number;
  addCost: (cost: number) => void;
  resetCost: () => void;
}

const CostContext = createContext<CostContextType | undefined>(undefined);

export function CostProvider({ children }: { children: ReactNode }) {
  const [totalCost, setTotalCost] = useState(0);

  const addCost = (cost: number) => {
    setTotalCost((prev) => prev + cost);
  };

  const resetCost = () => {
    setTotalCost(0);
  };

  return (
    <CostContext.Provider value={{ totalCost, addCost, resetCost }}>
      {children}
    </CostContext.Provider>
  );
}

export function useCost() {
  const context = useContext(CostContext);
  if (!context) {
    throw new Error("useCost must be used within CostProvider");
  }
  return context;
}

