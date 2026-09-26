import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Termos e condições de uso do Wishbox.",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="INFORMAÇÕES LEGAIS"
      title="Termos de uso"
      description="Estes termos definem as regras para acessar e utilizar o Wishbox. Ao criar uma conta ou continuar usando o serviço, você concorda com estas condições."
      updatedAt="18 de setembro de 2026"
    >
      <InfoSection title="1. Sobre o Wishbox">
        <p>
          O Wishbox é uma plataforma para criar, organizar e compartilhar listas de
          desejos, conectar pessoas e facilitar a escolha de presentes. O serviço não
          vende os produtos adicionados às listas e não participa da compra, entrega,
          troca ou garantia oferecida por lojas de terceiros.
        </p>
      </InfoSection>

      <InfoSection title="2. Cadastro e conta">
        <ul>
          <li>Você deve fornecer informações verdadeiras e mantê-las atualizadas.</li>
          <li>Você é responsável por proteger suas credenciais e pelas ações realizadas em sua conta.</li>
          <li>O uso por menores de idade deve ocorrer com autorização e acompanhamento de um responsável legal.</li>
          <li>Avise o suporte se suspeitar de acesso não autorizado.</li>
        </ul>
      </InfoSection>

      <InfoSection title="3. Conteúdo e uso permitido">
        <p>
          Você mantém a titularidade do conteúdo que publica e concede ao Wishbox uma
          licença limitada para armazená-lo, processá-lo e exibi-lo somente na medida
          necessária para operar e melhorar o serviço.
        </p>
        <p>Ao usar a plataforma, você concorda em não:</p>
        <ul>
          <li>publicar conteúdo ilegal, ofensivo, fraudulento ou que viole direitos de terceiros;</li>
          <li>usar o serviço para assediar pessoas, enviar spam ou aplicar golpes;</li>
          <li>tentar acessar contas, sistemas ou dados sem autorização;</li>
          <li>interferir no funcionamento ou contornar recursos de segurança da plataforma;</li>
          <li>copiar, explorar ou automatizar o acesso ao serviço de modo abusivo.</li>
        </ul>
      </InfoSection>

      <InfoSection title="4. Listas, links e reservas">
        <p>
          Você é responsável pelas informações, imagens e links adicionados às suas
          listas. Preços, disponibilidade e características de produtos podem mudar e
          devem ser confirmados diretamente com o vendedor. Reservas são apenas um
          recurso de organização e não garantem compra, estoque ou entrega.
        </p>
      </InfoSection>

      <InfoSection title="5. Disponibilidade e alterações">
        <p>
          Buscamos manter o Wishbox seguro e disponível, mas o serviço pode apresentar
          interrupções ou mudar ao longo do tempo. Podemos adicionar, modificar ou
          descontinuar funcionalidades e realizar manutenções quando necessário.
        </p>
      </InfoSection>

      <InfoSection title="6. Suspensão e encerramento">
        <p>
          Você pode deixar de usar o Wishbox e excluir sua conta nas Configurações.
          Podemos restringir ou encerrar contas que violem estes termos, coloquem outras
          pessoas em risco ou comprometam a plataforma, observada a legislação aplicável.
        </p>
      </InfoSection>

      <InfoSection title="7. Responsabilidades">
        <p>
          O Wishbox é oferecido como uma ferramenta de organização e compartilhamento.
          Na extensão permitida pela lei, não nos responsabilizamos por negociações com
          terceiros, conteúdo publicado por usuários, alterações em sites externos ou
          danos decorrentes de uso indevido da plataforma. Nada nestes termos limita
          direitos que não possam ser afastados pela legislação brasileira.
        </p>
      </InfoSection>

      <InfoSection title="8. Disposições finais e contato">
        <p>
          Estes termos são regidos pelas leis da República Federativa do Brasil. Podemos
          atualizá-los para refletir mudanças legais ou no serviço; alterações relevantes
          serão comunicadas pelos meios disponíveis. Dúvidas podem ser enviadas para
          <a href="mailto:suporte@wishbox.app"> suporte@wishbox.app</a>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
