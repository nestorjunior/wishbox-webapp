"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, deleteUser as deleteFirebaseUser } from "firebase/auth";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Lock,
  LogOut,
  Moon,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/Toast";
import { Avatar, ConfirmDialog, Toggle } from "@/components/ui";
import { auth } from "@/lib/firebase";
import { ApiError, deleteUser, updateUser } from "@/lib/api";
import { useWishbox } from "@/store/wishbox-store";

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1">
      <p className="px-1 text-xs font-bold tracking-wide text-muted">
        {label}
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

function SettingToggle({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border p-3.5 last:border-b-0">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        ) : null}
      </div>
      <Toggle value={value} onValueChange={onChange} />
    </div>
  );
}

function SettingArrow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border p-3.5 text-left last:border-b-0"
    >
      {icon}
      <p className="flex-1 text-sm font-semibold text-foreground">{label}</p>
      <ChevronRight size={18} className="text-muted" />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { me, backendUser, state, dispatch } = useWishbox();
  const { showToast } = useToast();
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const setPrivateProfile = async (value: boolean) => {
    if (savingPrivacy) return;
    const firebaseUser = auth?.currentUser;
    const userId = backendUser?.id;
    if (!firebaseUser || !userId) {
      showToast({
        text: "Faça login novamente para editar seu perfil.",
        tone: "warning",
      });
      return;
    }

    try {
      setSavingPrivacy(true);
      const token = await firebaseUser.getIdToken();
      const updated = await updateUser(token, userId, { private: value });
      dispatch({ type: "auth/set-backend-user", user: updated });
      dispatch({
        type: "profile/update",
        patch: { privacy: value ? "private" : "public" },
      });
      showToast({ text: `Seu perfil agora é ${value ? "privado" : "público"}` });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? `${error.message} (status ${error.status})`
          : "Não foi possível atualizar a privacidade agora.";
      showToast({ text: message, tone: "warning" });
    } finally {
      setSavingPrivacy(false);
    }
  };

  const doLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      if (auth) await signOut(auth);
      dispatch({ type: "auth/logout" });
      router.replace("/");
    } catch {
      showToast({ text: "Não foi possível sair. Tente novamente.", tone: "warning" });
    } finally {
      setLoggingOut(false);
    }
  };

  const deleteAccount = async () => {
    if (deletingAccount) return;
    const firebaseUser = auth?.currentUser;
    const userId = backendUser?.id;
    if (!auth || !firebaseUser || !userId) {
      setDeleteOpen(false);
      showToast({
        text: "Faça login novamente para excluir sua conta.",
        tone: "warning",
      });
      return;
    }

    try {
      setDeletingAccount(true);
      const token = await firebaseUser.getIdToken();
      await deleteUser(token, userId);

      try {
        await deleteFirebaseUser(firebaseUser);
      } catch (firebaseError) {
        if (
          firebaseError &&
          typeof firebaseError === "object" &&
          "code" in firebaseError &&
          firebaseError.code === "auth/requires-recent-login"
        ) {
          await signOut(auth);
          dispatch({ type: "auth/logout" });
          setDeleteOpen(false);
          showToast({
            text: "Sua conta foi excluída. Faça login novamente para concluir a remoção.",
          });
          router.replace("/");
          return;
        }
        throw firebaseError;
      }

      await signOut(auth);
      dispatch({ type: "auth/logout" });
      setDeleteOpen(false);
      router.replace("/");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? `${error.message} (status ${error.status})`
          : "Não foi possível excluir sua conta agora.";
      showToast({ text: message, tone: "warning" });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 bg-background p-4 pb-24">
      <AppHeader />

      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-[0_6px_14px_-2px_rgba(27,27,51,0.06)]">
        <Avatar photo={me?.photo} emoji={me?.emoji ?? "👤"} tint={me?.tint ?? "lilac"} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-foreground">
            {me?.name ?? "Sua conta"}
          </p>
          <p className="truncate text-sm text-muted">
            {me ? `@${me.username}` : "Carregando perfil…"}
          </p>
        </div>
        <Link
          href="/profile-edit"
          className="rounded-md border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground"
        >
          Editar
        </Link>
      </div>

      <Section label="PRIVACIDADE">
        <SettingToggle
          icon={<Lock size={18} className="text-foreground" />}
          label="Perfil privado"
          description="Só quem você aprova vê suas listas."
          value={backendUser?.private ?? me?.privacy === "private"}
          onChange={(value) => void setPrivateProfile(value)}
        />
        <SettingArrow
          icon={<ShieldAlert size={18} className="text-foreground" />}
          label="Contas bloqueadas"
          onClick={() => {}}
        />
      </Section>

      <Section label="NOTIFICAÇÕES">
        <SettingToggle
          icon={<Bell size={18} className="text-foreground" />}
          label="Lembretes de aniversário"
          description="Avisamos alguns dias antes do aniversário das suas conexões."
          value={state.reminders.birthdays}
          onChange={(value) =>
            dispatch({ type: "reminders/set", patch: { birthdays: value } })
          }
        />
        <SettingToggle
          icon={<CalendarDays size={18} className="text-foreground" />}
          label="Datas comemorativas"
          description="Natal, Dia das Mães, Dia dos Namorados e outras datas."
          value={state.reminders.holidays}
          onChange={(value) =>
            dispatch({ type: "reminders/set", patch: { holidays: value } })
          }
        />
      </Section>

      <Section label="APARÊNCIA">
        <SettingToggle
          icon={<Moon size={18} className="text-foreground" />}
          label="Modo escuro"
          value={state.darkMode}
          onChange={(value) => dispatch({ type: "appearance/set-dark-mode", value })}
        />
      </Section>

      <Section label="CONTA">
        <SettingArrow
          icon={<LogOut size={18} className="text-foreground" />}
          label={loggingOut ? "Saindo…" : "Sair da conta"}
          onClick={() => void doLogout()}
        />
        <SettingArrow
          icon={<Trash2 size={18} className="text-danger" />}
          label="Excluir minha conta"
          onClick={() => setDeleteOpen(true)}
        />
      </Section>

      <ConfirmDialog
        visible={deleteOpen}
        title="Excluir sua conta?"
        description="Essa ação remove permanentemente seu perfil, listas e produtos do Wishbox."
        confirmLabel="Excluir conta"
        cancelLabel="Voltar"
        loading={deletingAccount}
        onConfirm={() => void deleteAccount()}
        onCancel={() => setDeleteOpen(false)}
      />

      <BottomNav />
    </div>
  );
}
