"use client";

import Image from "next/image";
import { Camera, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ProductImagePicker({
  value,
  onChange,
  onError,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  onError?: (message: string) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(value);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [value]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError?.("Selecione um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError?.("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    onError?.("");
    onChange(file);
  };

  const clearImage = () => {
    onChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-background">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={previewUrl}
              alt="Pré-visualização do produto"
              fill
              unoptimized
              className="object-contain"
            />
          </div>

          <button
            type="button"
            onClick={clearImage}
            aria-label="Remover imagem"
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/65 text-white transition-opacity hover:opacity-80"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-4 text-center transition-colors hover:bg-primary-soft/30"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft">
            <Camera size={20} className="text-primary" />
          </span>

          <span className="text-sm font-semibold text-foreground">
            Adicionar uma imagem
          </span>

          <span className="text-xs text-muted">
            JPG, PNG ou WebP · até 5 MB
          </span>
        </label>
      )}

      <Button
        type="button"
        size="sm"
        title={value ? "Trocar imagem" : "Selecionar imagem"}
        variant="outline"
        icon={<Camera size={15} />}
        onClick={() => inputRef.current?.click()}
        className="w-full"
      />
    </div>
  );
}