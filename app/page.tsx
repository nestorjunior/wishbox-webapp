"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Eye, EyeOff, Gift, Loader2, Lock, Mail } from "lucide-react";
import { Screen } from "@/components/Screen";
import { Button, Field } from "@/components/ui";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { WishboxProvider, useWishbox } from "@/store/wishbox-store";

function firebaseErrorMessage(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou senha incorretos.";
    case "auth/email-already-in-use":
      return "Este e-mail já está cadastrado.";
    case "auth/weak-password":
      return "Escolha uma senha com pelo menos 6 caracteres.";
    case "auth/invalid-email":
      return "Informe um e-mail válido.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
    default:
      return "Não foi possível concluir a operação. Tente novamente.";
  }
}

function LoginContent() {
  const { authReady, backendUser, state } = useWishbox();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      setMessage("O Firebase ainda não está configurado neste ambiente.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      setMessage(firebaseErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!auth || !email.trim()) {
      setMessage("Informe seu e-mail para recuperar a senha.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Enviamos um link de recuperação para o seu e-mail.");
    } catch (error) {
      setMessage(firebaseErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (backendUser) {
    return (
      <Screen>
        <main className="flex flex-1 flex-col justify-center py-12">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
              <Gift className="text-primary" size={24} />
            </div>
            <span className="text-2xl font-extrabold tracking-wide text-primary">
              WISHBOX
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">
            Olá, {backendUser.displayName ?? backendUser.username}.
          </h1>
          <p className="mt-3 text-muted">
            Sua sessão está ativa e seus dados vieram da API.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-2xl font-extrabold text-primary">
                {state.lists.length}
              </p>
              <p className="mt-1 text-xs text-muted">Listas</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-2xl font-extrabold text-primary">
                {state.products.length}
              </p>
              <p className="mt-1 text-xs text-muted">Itens</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-2xl font-extrabold text-primary">
                {state.notifications.length}
              </p>
              <p className="mt-1 text-xs text-muted">Notificações</p>
            </div>
          </div>
        </main>
      </Screen>
    );
  }

  return (
    <Screen>
      <main className="mx-auto flex w-full max-w-82.5 flex-1 flex-col justify-center py-2">
        <div className="flex flex-col items-center text-center">
          <div className="mb-7 flex items-center gap-1.5 text-[11px] font-extrabold tracking-[0.22em] text-primary">
            <Gift size={14} strokeWidth={2.5} />
            WISHBOX
          </div>
          <Image
            src="/images/login-gift.png"
            alt="Presente Wishbox"
            width={118}
            height={118}
            className="mb-5 size-29.5 object-contain"
          />
          <h1 className="text-[23px] font-bold leading-tight text-foreground">
            Entre ou crie sua conta
          </h1>
          <p className="mt-2 max-w-67.5 text-[13px] leading-5 text-muted">
            Crie listas, salve desejos e compartilhe com quem você quiser.
          </p>
        </div>

        <section className="mt-6 w-full">
          <form onSubmit={submit} className="space-y-2.5">
            <Field
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Seu e-mail"
              icon={<Mail size={18} className="text-muted" />}
            />
            <Field
              required
              minLength={6}
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              icon={<Lock size={18} className="text-muted" />}
              rightAccessory={
                <button
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={
                    passwordVisible ? "Ocultar senha" : "Mostrar senha"
                  }
                  className="px-3.5 text-muted"
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {message ? (
              <p className="rounded-xl bg-tint-rose px-4 py-3 text-sm text-danger">
                {message}
              </p>
            ) : null}

            <Button
              type="submit"
              title="Continuar"
              disabled={busy || !isFirebaseConfigured}
              loading={busy}
              className="w-full"
            />
          </form>

          <button
            type="button"
            onClick={resetPassword}
            className="mt-4 w-full text-center text-sm font-bold text-primary"
          >
            Esqueci minha senha
          </button>

          <p className="mt-5 text-center text-sm text-muted">
            Ainda não tem uma conta?{" "}
            <Link href="/signup" className="font-bold text-primary">
              Criar conta
            </Link>
          </p>
          <p className="mt-5 text-center text-[11px] leading-4.25 text-[#8A879A]">
            Ao continuar, você concorda com os{" "}
            <span className="font-medium text-[#35344A]">Termos de Uso</span>
            <br />e a{" "}
            <span className="font-medium text-[#35344A]">
              Política de Privacidade
            </span>
            .
          </p>
        </section>
      </main>
    </Screen>
  );
}

export default function Home() {
  return (
    <WishboxProvider>
      <LoginContent />
    </WishboxProvider>
  );
}
