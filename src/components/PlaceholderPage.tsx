import React from 'react';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-primary animate-pulse">
        <div className="w-8 h-8 bg-primary/20 rounded-full" />
      </div>
      <h2 className="text-2xl font-bold italic uppercase tracking-tight">{title}</h2>
      <p className="text-gray-500">Aguardando imagem para reconstrução desta página...</p>
    </div>
  );
}
