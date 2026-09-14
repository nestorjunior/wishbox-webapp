"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Button, Card, Field, Toggle } from "@/components/ui";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { normalizeUsername } from "@/lib/username";
import {
  clearPendingSignupProfile,
  setPendingSignupProfile,
  setWelcomeToastVisible,
} from "@/lib/api";

function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length < 2) return digits;
  if (digits.length < 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [showBirthYear, setShowBirthYear] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [gender, setGender] = useState("Prefiro não dizer");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !isFirebaseConfigured) {
      setMessage("O Firebase ainda não está configurado neste ambiente.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("A confirmação de senha não confere com a senha digitada.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await setPendingSignupProfile({
        name: name.trim(),
        username: normalizeUsername(username) || undefined,
        birthDate: birthDate.trim(),
        gender,
        showBirthYear,
      });
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      await updateProfile(credential.user, { displayName: name.trim() });
      await setWelcomeToastVisible();
      router.replace("/");
    } catch {
      await clearPendingSignupProfile();
      setMessage(
        "Não foi possível criar a conta. Confira os dados e tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4">
        <FormHeader />
        <div className="mt-2 space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Criar conta</h1>
          <p className="text-sm leading-5 text-muted">
            Leva menos de um minuto. Depois é só montar suas listas.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Card className="space-y-3.5">
            <Field
              label="Nome completo"
              placeholder="Como quer ser chamado?"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Field
              label="Nome de usuário"
              placeholder="@ seunome"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Field
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Field
              label="Senha"
              type="password"
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Field
              label="Repetir a senha"
              type="password"
              minLength={8}
              placeholder="Digite a senha novamente"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Sexo"
                as="select"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
              >
                <option>Prefiro não dizer</option>
                <option>Feminino</option>
                <option>Masculino</option>
                <option>Outro</option>
              </Field>
              <Field
                label="Nascimento"
                placeholder="dd / mm / aaaa"
                inputMode="numeric"
                value={formatBirthDate(birthDate)}
                onChange={(event) =>
                  setBirthDate(event.target.value.replace(/\D/g, "").slice(0, 8))
                }
              />
            </div>
          </Card>

          <Card className="relative space-y-2">
            <p className="font-bold text-foreground">
              Mostrar o ano de nascimento
            </p>
            <p className="pr-14 text-xs leading-[18px] text-muted">
              Desative para exibir só o dia e o mês, sem revelar sua idade.
            </p>
            <div className="absolute top-4 right-4">
              <Toggle value={showBirthYear} onValueChange={setShowBirthYear} />
            </div>
          </Card>

          {message ? (
            <p className="rounded-md bg-tint-rose px-4 py-3 text-sm text-danger">
              {message}
            </p>
          ) : null}
          <Button
            title="Criar conta"
            type="submit"
            loading={busy}
            disabled={busy}
            className="w-full"
          />
        </form>

        <p className="pb-4 text-center text-sm text-muted">
          Já tem uma conta?{" "}
          <Link href="/" className="font-bold text-primary">
            Entrar
          </Link>
        </p>
      </main>
    </Screen>
  );
}
