"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Plus } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import type { User } from "@/lib/data";

const SLIDE_COUNT = 3;

export function OnboardingCarousel({
  me,
  onCreateList,
  onAddProduct,
}: {
  me: User;
  onCreateList: () => void;
  onAddProduct: () => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  const cardClass =
    "min-w-0 flex-[0_0_100%] rounded-(--radius-lg) border border-(--color-border) bg-(--color-card) p-4 shadow-[0_6px_14px_-2px_rgba(27,27,51,0.06)]";

  return (
    <div>
      <div
        className="overflow-hidden"
        ref={emblaRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Onboarding"
      >
        <div className="flex">
          <div className={cardClass} aria-hidden={selectedIndex !== 0}>
            <div className="flex items-center gap-3">
              <Avatar
                photo={me.photo}
                emoji={me.emoji}
                tint={me.tint}
                size={56}
              />
              <div className="flex-1">
                <p className="text-[17px] font-bold text-(--foreground)">
                  {me.name}
                </p>
                <p className="text-xs text-(--color-muted)">@{me.username}</p>
              </div>
            </div>
            <p className="mt-2.5 text-xs leading-[18px] text-(--color-muted)">
              {me.bio}
            </p>
            <div className="mt-3.5 flex flex-col gap-2">
              <Button
                title="Criar lista"
                icon={<Plus size={18} />}
                onClick={onCreateList}
              />
              <Button
                title="Adicionar produto"
                icon={<Plus size={18} />}
                variant="outline"
                onClick={onAddProduct}
              />
            </div>
          </div>

          <div className={cardClass} aria-hidden={selectedIndex !== 1}>
            <div className="mb-2.5 flex items-center gap-2.5">
              <Image
                src="/images/onboard-lista-icon.png"
                alt=""
                width={34}
                height={34}
                className="rounded-(--radius-sm)"
              />
              <span className="rounded-(--radius-full,999px) bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
                PASSO 1
              </span>
            </div>
            <p className="text-[17px] font-bold text-(--foreground)">
              Crie sua lista
            </p>
            <p className="mt-1 text-xs leading-[18px] text-(--color-muted)">
              Dê um nome, escolha se ela é pública, privada ou só para
              convidados.
            </p>
            <Button
              title="Criar lista"
              icon={<Plus size={18} />}
              onClick={onCreateList}
              className="mt-3.5 w-full"
            />
          </div>

          <div className={cardClass} aria-hidden={selectedIndex !== 2}>
            <div className="mb-2.5 flex items-center gap-2.5">
              <Image
                src="/images/onboard-presente-icon.png"
                alt=""
                width={34}
                height={34}
                className="rounded-(--radius-sm)"
              />
              <span className="rounded-(--radius-full,999px) bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
                PASSO 2
              </span>
            </div>
            <p className="text-[17px] font-bold text-(--foreground)">
              Adicione produtos
            </p>
            <p className="mt-1 text-xs leading-[18px] text-(--color-muted)">
              Cole o link da loja, envie uma foto ou cadastre manualmente na
              sua lista.
            </p>
            <Button
              title="Adicionar produto"
              icon={<Plus size={18} />}
              variant="outline"
              onClick={onAddProduct}
              className="mt-3.5 w-full"
            />
          </div>
        </div>
      </div>
      <div
        className="mt-2.5 flex justify-center gap-1.5"
        role="tablist"
        aria-label="Slides do onboarding"
      >
        {Array.from({ length: SLIDE_COUNT }, (_, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === selectedIndex}
            aria-label={`Ir para o slide ${index + 1}`}
            onClick={() => scrollTo(index)}
            className="h-1.5 rounded-full bg-(--color-border) transition-all"
            style={{
              width: index === selectedIndex ? 18 : 6,
              backgroundColor:
                index === selectedIndex ? "var(--color-primary)" : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}