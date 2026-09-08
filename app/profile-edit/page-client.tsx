"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
import { Button, Card, Field, Toggle } from "@/components/ui";
import { auth } from "@/lib/firebase";
import { ApiError, updateUser } from "@/lib/api";
import { useWishbox } from "@/store/wishbox-store";

export default function ProfileEditPage() {
  const router = useRouter();
  const { me, backendUser, dispatch } = useWishbox();
  const { showToast } = useToast();
  const [name, setName] = useState(me?.name ?? "");
  const [username, setUsername] = useState(me?.username ?? "");
  const [bio, setBio] = useState(me?.bio ?? "");
  const [isPrivate, setIsPrivate] = useState(me?.privacy === "private");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser || !backendUser) {
      showToast({ text: "Sessão expirada. Faça login novamente.", tone: "warning" });
      return;
    }

    try {
      setBusy(true);
      const token = await firebaseUser.getIdToken();
      const updated = await updateUser(token, backendUser.id, {
        displayName: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        private: isPrivate,
      });
      dispatch({ type: "auth/set-backend-user", user: updated });
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
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4">
        <FormHeader back="/settings" />
        <div className="mt-2 space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Editar perfil</h1>
          <p className="text-sm leading-5 text-muted">Atualize suas informações públicas.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Card className="space-y-3.5">
            <Field
              label="Nome completo"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Field
              label="Nome de usuário"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Field
              label="Bio"
              as="input"
              multiline
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </Card>

          <Card className="relative space-y-2">
            <p className="font-bold text-foreground">Perfil privado</p>
            <p className="pr-14 text-xs leading-[18px] text-muted">
              Só quem você aprova vê suas listas.
            </p>
            <div className="absolute top-4 right-4">
              <Toggle value={isPrivate} onValueChange={setIsPrivate} />
            </div>
          </Card>

          <Button title="Salvar" type="submit" loading={busy} disabled={busy} className="w-full" />
        </form>
      </main>
    </Screen>
  );
}
