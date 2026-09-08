"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Lock, Users } from "lucide-react";
import { Button, Card, Field } from "@/components/ui";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { auth } from "@/lib/firebase";
import { createList } from "@/lib/api";
import { useWishbox } from "@/store/wishbox-store";

type Privacy = "public" | "private" | "guests";

const templates = [
  ["🎁", "Aniversário", "Presentes para comemorar"],
  ["🏡", "Casa nova", "Tudo para o novo lar"],
  ["🎄", "Natal", "Ideias para o fim do ano"],
  ["🧳", "Viagem", "O que levar na próxima viagem"],
  ["💻", "Tecnologia", "Desejos e novidades"],
] as const;

type Template = (typeof templates)[number];

export default function CreateListPage() {
  const router = useRouter();
  const { backendUser, dispatch } = useWishbox();
  const [template, setTemplate] = useState<Template>(templates[0]);
  const [name, setName] = useState<string>(template[1]);
  const [description, setDescription] = useState<string>(template[2]);
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth?.currentUser || !backendUser) {
      setMessage("Faça login novamente para criar uma lista.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const token = await auth.currentUser.getIdToken();
      const created = await createList(token, {
        name: name.trim() || template[1],
        description: description.trim() || undefined,
        private: privacy !== "public",
        listType: privacy === "guests" ? "collaborative" : "standard",
      });
      dispatch({
        type: "list/create",
        list: {
          id: created.id,
          ownerId: backendUser.id,
          name: created.name,
          description: created.description ?? description,
          emoji: template[0],
          tint: "lilac",
          privacy,
          paused: false,
          category: template[1],
          members: [],
        },
      });
      router.push("/");
    } catch {
      setMessage("Não foi possível criar a lista agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4">
        <FormHeader />
        <div className="mt-2 space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Criar lista</h1>
          <p className="text-sm leading-5 text-muted">
            Organize seus desejos em um só lugar.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <section className="space-y-2">
            <h2 className="text-[17px] font-bold text-foreground">
              Modelos prontos
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {templates.map((item) => (
                <button
                  type="button"
                  key={item[1]}
                  onClick={() => {
                    setTemplate(item);
                    setName(item[1]);
                    setDescription(item[2]);
                  }}
                  className={`flex min-w-24 flex-col items-center gap-1 rounded-md border p-3 text-center transition-colors ${template[1] === item[1] ? "border-primary bg-primary-soft" : "border-border bg-card"}`}
                >
                  <span className="text-2xl">{item[0]}</span>
                  <span className="text-xs font-semibold text-foreground">
                    {item[1]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <Card className="space-y-3.5">
            <Field
              label="Nome da lista"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Meu aniversário"
              required
            />
            <Field
              label="Descrição"
              multiline
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Conte para as pessoas o que essa lista significa"
            />
          </Card>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">
              Privacidade
            </h2>
            {(
              [
                [
                  "public",
                  "Pública",
                  "Qualquer pessoa pode ver e reservar",
                  Globe,
                ],
                ["private", "Privada", "Só quem receber o link vai ver", Lock],
                [
                  "guests",
                  "Convidados",
                  "Apenas pessoas escolhidas podem acessar",
                  Users,
                ],
              ] as const
            ).map(([value, title, detail, Icon]) => (
              <button
                type="button"
                key={value}
                onClick={() => setPrivacy(value)}
                className={`flex w-full items-center gap-3 rounded-md border p-3 text-left ${privacy === value ? "border-primary bg-primary-soft" : "border-border bg-card"}`}
              >
                <Icon
                  size={19}
                  className={privacy === value ? "text-primary" : "text-muted"}
                />
                <span>
                  <strong className="block text-sm text-foreground">
                    {title}
                  </strong>
                  <small className="text-xs text-muted">{detail}</small>
                </span>
              </button>
            ))}
          </section>

          {message ? (
            <p className="rounded-md bg-tint-rose px-4 py-3 text-sm text-danger">
              {message}
            </p>
          ) : null}
          <Button
            title="Criar lista"
            type="submit"
            loading={busy}
            disabled={busy}
            className="w-full"
          />
        </form>
      </main>
    </Screen>
  );
}
