"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui";

type ProductImagePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  onFileChange?: (file: File | null) => void;
};

export function ProductImagePicker({
  value = "",
  onChange,
  onFileChange,
}: ProductImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const previewUrl = value.trim() || null;

  const revokeCurrentObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    revokeCurrentObjectUrl();

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;

    onChange(objectUrl);
    onFileChange?.(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    handleFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    handleFile(file);
  };

  const handleRemove = () => {
    revokeCurrentObjectUrl();
    onChange("");
    onFileChange?.(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleOpenPicker = () => {
    inputRef.current?.click();
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
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpenPicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpenPicker();
            }
          }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            "flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed",
            "bg-background text-sm text-muted transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/10",
          ].join(" ")}
        >
          <Camera size={24} />

          <span>
            {isDragging
              ? "Solte a imagem aqui"
              : "Adicionar imagem"}
          </span>

          <span className="text-xs text-muted">
            Clique para selecionar ou arraste uma imagem
          </span>
        </div>
      )}
    </div>
  );
}

