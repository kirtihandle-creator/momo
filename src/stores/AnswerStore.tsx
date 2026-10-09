import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface AnswerEntity {
  id: string;
  name: string;
  favorite: boolean;
  updatedAt: number;
}