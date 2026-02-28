import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  inputTokens: number;
  outputTokens: number;
  sessions: number;
  estimatedCost: number;
}

export interface ModelUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

interface AnalyticsState {
  dailyUsage: DailyUsage[];
  modelBreakdown: ModelUsage[];
  tokenAlert: number; // daily token alert threshold (0 = disabled)

  recordUsage: (inputTokens: number, outputTokens: number, model?: string) => void;
  setTokenAlert: (threshold: number) => void;
  getTodayUsage: () => DailyUsage | undefined;
  getWeekTotal: () => { inputTokens: number; outputTokens: number; estimatedCost: number };
}

const COST_PER_1M_INPUT = 3.0; // Claude Sonnet 4 input pricing
const COST_PER_1M_OUTPUT = 15.0; // Claude Sonnet 4 output pricing

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcCost(input: number, output: number): number {
  return (input / 1_000_000) * COST_PER_1M_INPUT + (output / 1_000_000) * COST_PER_1M_OUTPUT;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      dailyUsage: [],
      modelBreakdown: [],
      tokenAlert: 0,

      recordUsage: (inputTokens, outputTokens, model = "claude-sonnet-4") => {
        const date = today();
        set((s) => {
          const existing = s.dailyUsage.find((d) => d.date === date);
          const cost = calcCost(inputTokens, outputTokens);

          const dailyUsage = existing
            ? s.dailyUsage.map((d) =>
                d.date === date
                  ? {
                      ...d,
                      inputTokens: d.inputTokens + inputTokens,
                      outputTokens: d.outputTokens + outputTokens,
                      estimatedCost: d.estimatedCost + cost,
                    }
                  : d
              )
            : [
                ...s.dailyUsage,
                { date, inputTokens, outputTokens, sessions: 1, estimatedCost: cost },
              ];

          const existingModel = s.modelBreakdown.find((m) => m.model === model);
          const modelBreakdown = existingModel
            ? s.modelBreakdown.map((m) =>
                m.model === model
                  ? { ...m, inputTokens: m.inputTokens + inputTokens, outputTokens: m.outputTokens + outputTokens }
                  : m
              )
            : [...s.modelBreakdown, { model, inputTokens, outputTokens }];

          return { dailyUsage: dailyUsage.slice(-90), modelBreakdown };
        });
      },

      setTokenAlert: (threshold) => set({ tokenAlert: threshold }),

      getTodayUsage: () => get().dailyUsage.find((d) => d.date === today()),

      getWeekTotal: () => {
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const week = get().dailyUsage.filter(
          (d) => new Date(d.date).getTime() >= weekAgo
        );
        return {
          inputTokens: week.reduce((sum, d) => sum + d.inputTokens, 0),
          outputTokens: week.reduce((sum, d) => sum + d.outputTokens, 0),
          estimatedCost: week.reduce((sum, d) => sum + d.estimatedCost, 0),
        };
      },
    }),
    {
      name: "prism-analytics",
    }
  )
);
