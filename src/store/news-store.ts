"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';

export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface NewsAnalysis {
  keyTopics: string[];
  marketImpact?: string;
  tradingSignals?: string[];
  confidence?: number;
}

export interface SymbolNewsData {
  symbol: string;
  articles: NewsArticle[];
  analysis: NewsAnalysis[];
  lastUpdated: string;
}

interface NewsStore {
  // State
  newsData: SymbolNewsData[];
  
  // Actions
  addNewsData: (symbol: string, articles: NewsArticle[], analysis: NewsAnalysis[]) => void;
  getNewsData: (symbol: string) => SymbolNewsData | null;
  clearNewsData: (symbol: string) => void;
  clearAllNewsData: () => void;
}

const INITIAL_STATE = {
  newsData: [],
};

export const useNewsStore = create(
  persist<NewsStore>(
    (set, get) => ({
      ...INITIAL_STATE,

      addNewsData: (symbol: string, articles: NewsArticle[], analysis: NewsAnalysis[]) => {
        set(state => {
          const newsData = [...state.newsData];
          const existingIndex = newsData.findIndex(data => data.symbol === symbol);
          
          const updatedData = {
            symbol,
            articles,
            analysis,
            lastUpdated: new Date().toISOString()
          };

          if (existingIndex !== -1) {
            newsData[existingIndex] = updatedData;
          } else {
            newsData.push(updatedData);
          }

          return { newsData };
        });
      },

      getNewsData: (symbol: string) => {
        const state = get();
        return state.newsData.find(data => data.symbol === symbol) || null;
      },

      clearNewsData: (symbol: string) => {
        set(state => ({
          newsData: state.newsData.filter(data => data.symbol !== symbol)
        }));
      },

      clearAllNewsData: () => {
        set({ newsData: [] });
      }
    }),
    {
      name: 'news-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);