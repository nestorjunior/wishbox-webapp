import type { Metadata } from "next";
import { CircleHelp, Mail, ShieldCheck } from "lucide-react";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Ajuda e suporte",
  description: "Respostas e canais de suporte do Wishbox.",
};

export default function HelpPage() {
  return (
    <InfoPage
      eyebrow="CENTRAL DE AJUDA"
      title="Como podemos ajudar?"
      description="Encontre respostas para as dúvidas mais comuns sobre sua conta, listas, privacidade e presentes."
    >
      <InfoSection title="Dúvidas frequentes">
        <div>
          <strong>Como criar e compartilhar uma lista?</strong>
          <p>
            Na tela inicial, selecione a opção para criar uma lista, escolha um nome e
            defina a privacidade. Depois de adicionar seus desejos, use o botão de
            compartilhamento para enviar a lista a familiares e amigos.
          </p>
        </div>
        <div>
          <strong>Quem pode ver minhas listas?</strong>
          <p>
            Listas públicas podem ser vistas por outras pessoas. Listas privadas ficam
            disponíveis somente para você e para participantes autorizados. Você pode
            alterar essa escolha ao editar a lista.
          </p>
        </div>
        <div>
          <strong>Como funcionam as reservas de presentes?</strong>
          <p>
            Ao reservar um item, outras pessoas podem saber que ele já foi escolhido,
            evitando presentes repetidos. O dono da lista não vê quem fez a reserva,
            preservando a surpresa.
          </p>
        </div>
        <div>
          <strong>Como editar ou excluir minha conta?</strong>
          <p>
            Seus dados de perfil podem ser atualizados em Configurações. Para apagar a
            conta e os dados associados, acesse Configurações, Conta e selecione
            “Excluir minha conta”. Essa ação é permanente.
          </p>
        </div>
      </InfoSection>

      <InfoSection title="Segurança e privacidade">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={20} />
          <p>
            Nunca compartilhe sua senha ou códigos de acesso. O Wishbox não solicita
            essas informações por mensagens. Para saber como tratamos dados pessoais,
            consulte nossa <a href="/privacy">Política de Privacidade</a>.
          </p>
        </div>
      </InfoSection>

      <InfoSection title="Ainda precisa de ajuda?">
        <div className="flex gap-3">
          <CircleHelp className="mt-0.5 shrink-0 text-primary" size={20} />
          <p>
            Envie uma descrição do problema, o e-mail da sua conta e, se possível, uma
            captura de tela. Não inclua senhas, códigos de autenticação ou dados de
            pagamento.
          </p>
        </div>
        <a
          href="mailto:suporte@wishbox.app?subject=Ajuda%20com%20o%20Wishbox"
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-primary"
        >
          <Mail size={18} /> Falar com o suporte
        </a>
        <p className="text-xs">E-mail: suporte@wishbox.app</p>
      </InfoSection>
    </InfoPage>
  );
}
