import Link from "next/link";
import { Gift } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
        <Gift className="text-primary" size={24} />
      </div>
      <h1 className="text-xl font-bold text-foreground">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted">
        O link que você acessou não existe ou foi movido.
      </p>
      <Link
        href="/"
        className="flex h-[46px] items-center justify-center rounded-md bg-primary px-5 text-sm font-bold text-white"
      >
        Voltar para o início
      </Link>
    </div>
  );
}

