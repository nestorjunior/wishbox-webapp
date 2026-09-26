import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Saiba como o Wishbox trata e protege seus dados pessoais.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="SEUS DADOS"
      title="Política de privacidade"
      description="Esta política explica quais dados o Wishbox utiliza, para quais finalidades e quais escolhas você tem ao usar a plataforma."
      updatedAt="18 de setembro de 2026"
    >
      <InfoSection title="1. Dados que coletamos">
        <p>Conforme os recursos utilizados, podemos tratar:</p>
        <ul>
          <li><strong>dados de cadastro:</strong> nome, nome de usuário, e-mail, foto e data de nascimento;</li>
          <li><strong>conteúdo:</strong> listas, produtos, descrições, comentários, conexões e reservas;</li>
          <li><strong>preferências:</strong> privacidade do perfil e das listas, lembretes e notificações;</li>
          <li><strong>dados técnicos:</strong> endereço IP, navegador, dispositivo, registros de acesso, identificadores e informações de diagnóstico;</li>
          <li><strong>comunicações:</strong> mensagens enviadas ao suporte e informações necessárias para atender a solicitação.</li>
        </ul>
      </InfoSection>

      <InfoSection title="2. Como usamos seus dados">
        <ul>
          <li>criar e autenticar sua conta;</li>
          <li>exibir seu perfil, listas e conteúdo conforme suas escolhas de privacidade;</li>
          <li>permitir conexões, compartilhamentos, comentários, reservas e lembretes;</li>
          <li>personalizar e melhorar a experiência, medir desempenho e corrigir falhas;</li>
          <li>enviar avisos de serviço e notificações que você habilitar;</li>
          <li>prevenir fraude, abuso e incidentes de segurança;</li>
          <li>cumprir obrigações legais e exercer direitos em processos.</li>
        </ul>
      </InfoSection>

      <InfoSection title="3. Bases legais">
        <p>
          Tratamos dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD),
          com base, conforme o caso, na execução do serviço solicitado por você, no seu
          consentimento, no cumprimento de obrigações legais, no exercício regular de
          direitos e em interesses legítimos avaliados com respeito aos seus direitos e
          liberdades.
        </p>
      </InfoSection>

      <InfoSection title="4. Compartilhamento de dados">
        <p>
          Compartilhamos dados apenas quando necessário com provedores que apoiam a
          operação do Wishbox, como serviços de hospedagem, autenticação, armazenamento,
          análise, comunicação e segurança. Esses fornecedores recebem somente os dados
          necessários e devem protegê-los. Também podemos compartilhar informações por
          obrigação legal, ordem de autoridade competente, proteção de direitos ou em uma
          reorganização societária, com as salvaguardas aplicáveis.
        </p>
        <p>Não vendemos seus dados pessoais.</p>
      </InfoSection>

      <InfoSection title="5. Visibilidade e suas escolhas">
        <p>
          Nome, nome de usuário, foto e conteúdo público podem ser vistos por outras
          pessoas. Perfis e listas privados respeitam as permissões exibidas no aplicativo.
          Ainda assim, pessoas autorizadas podem copiar ou compartilhar o que visualizam.
          Revise suas opções em Configurações antes de publicar informações sensíveis.
        </p>
      </InfoSection>

      <InfoSection title="6. Armazenamento e segurança">
        <p>
          Mantemos os dados pelo tempo necessário para oferecer o serviço, cumprir
          obrigações legais, resolver disputas e prevenir abusos. Adotamos medidas
          técnicas e organizacionais para reduzir riscos de acesso, alteração, perda ou
          divulgação indevida. Nenhum sistema é totalmente imune; se identificar uma
          vulnerabilidade, avise nosso suporte.
        </p>
      </InfoSection>

      <InfoSection title="7. Seus direitos">
        <p>Nos termos da LGPD, você pode solicitar, quando aplicável:</p>
        <ul>
          <li>confirmação do tratamento e acesso aos dados;</li>
          <li>correção de informações incompletas, inexatas ou desatualizadas;</li>
          <li>portabilidade, anonimização, bloqueio ou eliminação;</li>
          <li>informações sobre compartilhamento e consequências de não consentir;</li>
          <li>revogação do consentimento e revisão de decisões automatizadas.</li>
        </ul>
        <p>
          Podemos solicitar informações para confirmar sua identidade. Alguns dados podem
          ser mantidos quando houver obrigação ou outra base legal para conservação.
        </p>
      </InfoSection>

      <InfoSection title="8. Crianças e adolescentes">
        <p>
          O Wishbox não é direcionado a crianças sem acompanhamento. Responsáveis legais
          devem supervisionar o uso por menores e podem entrar em contato para exercer os
          direitos correspondentes ou comunicar um cadastro inadequado.
        </p>
      </InfoSection>

      <InfoSection title="9. Atualizações e contato">
        <p>
          Esta política pode ser atualizada para refletir mudanças no serviço ou na lei.
          Alterações relevantes serão comunicadas pelos meios disponíveis. Para tirar
          dúvidas ou exercer direitos de privacidade, escreva para
          <a href="mailto:privacidade@wishbox.app"> privacidade@wishbox.app</a>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
