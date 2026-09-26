import type { ReactNode } from "react";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";

export function InfoPage({
  eyebrow,
  title,
  description,
  updatedAt,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <Screen header contentClassName="gap-6 pb-16 sm:pt-6">
      <FormHeader back="/settings" />

      <header className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-6">
        <p className="text-[11px] font-extrabold tracking-[0.12em] text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          {description}
        </p>
        {updatedAt ? (
          <p className="mt-4 text-xs font-semibold text-muted">
            Última atualização: {updatedAt}
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-4">{children}</div>
    </Screen>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-6">
      <h2 className="text-base font-extrabold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted [&_a]:font-semibold [&_a]:text-primary [&_li]:pl-1 [&_strong]:font-bold [&_strong]:text-foreground [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
