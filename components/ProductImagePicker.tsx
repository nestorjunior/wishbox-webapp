"use client";

import { ChangeEvent, useMemo, useRef } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui";

type ProductImagePickerProps = {
  value?: string;
  onChange: (value: string) => void;
};

export function ProductImagePicker({
  value = "",
  onChange,
}: ProductImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(() => {
    const normalizedValue = value.trim();

    return normalizedValue || null;
  }, [value]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    onChange(objectUrl);
  };

  const handleRemove = () => {
    onChange("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-border">
          <Image
            src={previewUrl}
            alt="Prévia do produto"
            width={640}
            height={640}
            className="aspect-square w-full object-cover"
            unoptimized
          />

          <Button
            type="button"
            title="Remover imagem"
            variant="outline"
            icon={<X size={16} />}
            onClick={handleRemove}
            className="absolute right-2 top-2"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background text-sm text-muted transition-colors hover:bg-muted/10"
        >
          <Camera size={24} />
          <span>Adicionar imagem</span>
        </button>
      )}
    </div>
  );
}