"use client";

import { useEffect } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
        <Gift className="text-primary" size={24} />
      </div>
      <h1 className="text-xl font-bold text-foreground">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-muted">
        Não foi possível carregar esta tela. Tente novamente em instantes.
      </p>
      <Button title="Tentar novamente" onClick={reset} />
    </div>
  );
}
