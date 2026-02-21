'use client';

import { LooperProvider } from '@/context/LooperContext';
import { LooperLayout } from '@/components/Layout/LooperLayout';

export default function Home() {
  return (
    <LooperProvider>
      <LooperLayout />
    </LooperProvider>
  );
}
