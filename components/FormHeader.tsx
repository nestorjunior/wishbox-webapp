import Link from "next/link";
import { ChevronLeft, Gift } from "lucide-react";

export function FormHeader({ back = "/" }: { back?: string }) {
  return (
    <div className="flex items-center justify-between">
      <Link
        href={back}
        aria-label="Voltar"
        className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-opacity hover:opacity-70"
      >
        <ChevronLeft size={19} />
      </Link>
      <div className="flex items-center gap-2 text-[13px] font-extrabold tracking-[0.12em] text-primary">
        <Gift size={17} strokeWidth={2.5} />
        WISHBOX
      </div>
      <span className="size-9" aria-hidden="true" />
    </div>
  );
}
