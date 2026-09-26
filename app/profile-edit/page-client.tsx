"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
import { Avatar, Button, Field, Toggle } from "@/components/ui";
import { auth, uploadAvatarToStorage } from "@/lib/firebase";
import { ApiError, updateUser } from "@/lib/api";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { useWishbox } from "@/store/wishbox-store";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const acceptedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length < 2) return digits;
  if (digits.length < 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function initialBirthDate(month?: number, day?: number) {
  if (!month || !day) return "";
  return `${String(day).padStart(2, "0")}${String(month).padStart(2, "0")}`;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { me, backendUser, dispatch } = useWishbox();
  const { showToast } = useToast();
  const [name, setName] = useState(me?.name ?? "");
  const [username, setUsername] = useState(me?.username ?? "");
  const [bio, setBio] = useState(me?.bio ?? "");
  const [birthDate, setBirthDate] = useState(
    initialBirthDate(backendUser?.birthMonth, backendUser?.birthDay),
  );
  const [showBirthYear, setShowBirthYear] = useState(
    backendUser?.showBirthYear ?? me?.showBirthYear ?? true,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(me?.photo ?? "");
  const previewUrlRef = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const selectAvatar = (file?: File) => {
    if (!file) return;
    if (!acceptedAvatarTypes.has(file.type)) {
      showToast({ text: "Envie uma imagem JPG, PNG ou WebP.", tone: "warning" });
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      showToast({ text: "A foto deve ter no máximo 5 MB.", tone: "warning" });
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser || !backendUser) {
      showToast({ text: "Sessão expirada. Faça login novamente.", tone: "warning" });
      return;
    }

    const normalizedUsername = normalizeUsername(username);
    if (!isValidUsername(normalizedUsername)) {
      showToast({
        text: "O nome de usuário deve ter entre 3 e 30 caracteres, usando letras, números ou _.",
        tone: "warning",
      });
      return;
    }

    const birthDigits = birthDate.replace(/\D/g, "");
    const birthDay = Number(birthDigits.slice(0, 2));
    const birthMonth = Number(birthDigits.slice(2, 4));
    if (
      birthDigits.length > 0 &&
      (birthDigits.length < 4 || birthDay < 1 || birthDay > 31 || birthMonth < 1 || birthMonth > 12)
    ) {
      showToast({ text: "Informe uma data de nascimento válida.", tone: "warning" });
      return;
    }

    try {
      setBusy(true);
      const token = await firebaseUser.getIdToken();
      let avatarPath = backendUser.avatarPath;
      if (avatarFile) {
        const extension = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
        avatarPath = await uploadAvatarToStorage(
          avatarFile,
          `avatars/${backendUser.id}-${Date.now()}.${extension}`,
        );
      }
      const updated = await updateUser(token, backendUser.id, {
        displayName: name.trim(),
        username: normalizedUsername,
        bio: bio.trim(),
        avatarPath,
        ...(birthDigits.length >= 4 ? { birthDay, birthMonth } : {}),
        showBirthYear,
      });
      dispatch({ type: "auth/set-backend-user", user: updated });
      dispatch({
        type: "profile/update",
        patch: {
          name: updated.displayName ?? name.trim(),
          username: updated.username ?? normalizedUsername,
          bio: updated.bio ?? bio.trim(),
          photo: updated.avatarPath,
          birthday: birthDate,
          showBirthYear: updated.showBirthYear ?? showBirthYear,
        },
      });
      showToast({ text: "Perfil atualizado" });
      router.push("/settings");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? `${error.message} (status ${error.status})`
          : "Não foi possível atualizar o perfil agora.";
      showToast({ text: message, tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4">
        <FormHeader back="/settings" />
        <div className="mt-2 space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Editar perfil</h1>
          <p className="text-sm leading-5 text-muted">Atualize suas informações públicas.</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <section className="space-y-2">
            <p className="px-1 text-[11px] font-bold tracking-wide text-muted">FOTO DO PERFIL</p>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-5 shadow-card">
              <Avatar
                photo={avatarPreview || undefined}
                emoji={me?.emoji ?? "👤"}
                tint={me?.tint ?? "lilac"}
                size={88}
              />
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-bold text-primary transition-colors hover:bg-primary-soft">
                <Camera size={18} />
                Enviar foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => selectAvatar(event.target.files?.[0])}
                />
              </label>
              <p className="text-center text-xs text-muted">JPG, PNG ou WebP de até 5 MB.</p>
            </div>
          </section>

          <section className="space-y-2">
            <p className="px-1 text-[11px] font-bold tracking-wide text-muted">INFORMAÇÕES PÚBLICAS</p>
            <div className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-card">
              <Field
                label="Nome"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Field
                label="Nome de usuário"
                required
                value={username}
                onChange={(event) => setUsername(normalizeUsername(event.target.value))}
                hint="Disponibilidade confirmada ao salvar. Use letras, números ou _."
              />
              <Field
                label="Bio"
                as="input"
                multiline
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={280}
              />
              <Field
                label="Data de nascimento"
                placeholder="dd / mm / aaaa"
                inputMode="numeric"
                value={formatBirthDate(birthDate)}
                onChange={(event) =>
                  setBirthDate(event.target.value.replace(/\D/g, "").slice(0, 8))
                }
              />
            </div>
          </section>

          <section className="space-y-2">
            <p className="px-1 text-[11px] font-bold tracking-wide text-muted">PRIVACIDADE</p>
            <div className="relative rounded-lg border border-border bg-card p-5 shadow-card">
              <p className="font-bold text-foreground">Mostrar o ano de nascimento</p>
              <p className="mt-2 pr-14 text-xs leading-[18px] text-muted">
                Desative para exibir só o dia e o mês, sem revelar sua idade.
              </p>
              <div className="absolute top-5 right-5">
                <Toggle value={showBirthYear} onValueChange={setShowBirthYear} />
              </div>
            </div>
          </section>

          <Button title="Salvar" type="submit" loading={busy} disabled={busy} className="w-full" />
        </form>
      </main>
    </Screen>
  );
}
