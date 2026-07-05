export function getPrivacyPolicyHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidade - XamaJá</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #D1D5DB;
      background-color: #080808;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #FFFFFF;
      font-size: 2rem;
      border-bottom: 2px solid #1C1C1E;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #22C55E;
      font-size: 1.4rem;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    p, li {
      color: #9CA3AF;
      font-size: 1rem;
    }
    ul {
      padding-left: 20px;
      margin-bottom: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #1C1C1E;
      font-size: 0.85rem;
      color: #6B7280;
      text-align: center;
    }
    .highlight {
      color: #FFFFFF;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <h1>Política de Privacidade do XamaJá</h1>
  <p>Última atualização: 15 de junho de 2026</p>

  <p>Esta Política de Privacidade descreve como o aplicativo <span class="highlight">XamaJá</span> coleta, usa e compartilha suas informações pessoais quando você utiliza nossos serviços.</p>

  <h2>1. Coleta de Informações e Permissões</h2>
  <p>Para fornecer e melhorar nossos serviços de busca e contratação de prestadores locais, o aplicativo requer as seguintes informações e permissões:</p>
  <ul>
    <li><span class="highlight">Localização (GPS):</span> Coletamos sua localização precisa ou aproximada em primeiro plano para poder ordenar e exibir os prestadores de serviço e comércios que estão geograficamente mais próximos a você.</li>
    <li><span class="highlight">Câmera e Galeria de Fotos:</span> Acessamos a câmera e galeria do seu dispositivo exclusivamente quando você opta por carregar ou alterar fotos do seu perfil ou fotos da galeria de demonstração do seu serviço.</li>
    <li><span class="highlight">Dados de Conta:</span> Coletamos dados como nome, endereço de e-mail e número de telefone celular no momento do cadastro para criar sua identidade única no sistema.</li>
    <li><span class="highlight">Microfone:</span> Usado apenas se você optar por gravar mensagens de áudio para se comunicar com prestadores de serviço ou clientes através do chat integrado do aplicativo.</li>
  </ul>

  <h2>2. Uso dos Dados</h2>
  <p>Utilizamos os dados coletados exclusivamente para:</p>
  <ul>
    <li>Permitir que clientes localizem prestadores compatíveis na sua região geográfica.</li>
    <li>Facilitar o contato direto entre clientes e prestadores através do WhatsApp ou ligações telefônicas.</li>
    <li>Autenticar os usuários de forma segura.</li>
    <li>Enviar notificações operacionais sobre agendamentos ou mensagens.</li>
  </ul>

  <h2>3. Compartilhamento de Informações</h2>
  <p>O XamaJá valoriza a sua privacidade. Nós <span class="highlight">não vendemos ou alugamos</span> seus dados pessoais para terceiros.</p>
  <p>Os únicos dados expostos publicamente no aplicativo são as informações profissionais que o próprio Prestador de Serviço insere em seu perfil (como nome comercial, telefone de contato, fotos do serviço e descrição) para que potenciais clientes possam encontrá-lo e contatá-lo.</p>

  <h2>4. Segurança e Armazenamento</h2>
  <p>Seus dados são armazenados de forma segura utilizando infraestrutura moderna de banco de dados, com comunicação criptografada. Empregamos medidas técnicas organizacionais recomendadas para proteger seus dados contra perda, roubo ou uso indevido.</p>

  <h2>5. Seus Direitos e Exclusão de Dados</h2>
  <p>Você tem total controle sobre seus dados e pode gerenciar suas informações diretamente no aplicativo. Você tem o direito de:</p>
  <ul>
    <li>Visualizar, alterar ou corrigir qualquer informação do seu perfil a qualquer momento.</li>
    <li>Solicitar a <span class="highlight">exclusão definitiva</span> da sua conta e de todos os dados associados a ela enviando um e-mail para o suporte ou acessando as configurações de conta no aplicativo.</li>
  </ul>

  <h2>6. Contato</h2>
  <p>Se tiver dúvidas ou solicitações sobre esta Política de Privacidade, entre em contato conosco:</p>
  <p>E-mail de suporte: <a href="mailto:suporte.xamaja@gmail.com" style="color: #22C55E;">suporte.xamaja@gmail.com</a></p>

  <div class="footer">
    &copy; 2026 XamaJá - Todos os direitos reservados.
  </div>
</body>
</html>`;
}

export function getDeletionPolicyHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exclusão de Conta - XamaJá</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #D1D5DB;
      background-color: #080808;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #FFFFFF;
      font-size: 2rem;
      border-bottom: 2px solid #1C1C1E;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #22C55E;
      font-size: 1.4rem;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    p, li {
      color: #9CA3AF;
      font-size: 1rem;
    }
    ol, ul {
      padding-left: 20px;
      margin-bottom: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #1C1C1E;
      font-size: 0.85rem;
      color: #6B7280;
      text-align: center;
    }
    .highlight {
      color: #FFFFFF;
      font-weight: 600;
    }
    .warning-box {
      background-color: rgba(239, 68, 68, 0.1);
      border-left: 4px solid #EF4444;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 25px;
    }
    .warning-box p {
      color: #FCA5A5;
      margin: 0;
    }
  </style>
</head>
<body>
  <h1>Solicitação de Exclusão de Conta e Dados - XamaJá</h1>
  <p>Última atualização: 15 de junho de 2026</p>

  <p>No aplicativo <span class="highlight">XamaJá</span>, valorizamos o controle dos seus próprios dados. Esta página explica detalhadamente como você pode solicitar a exclusão de sua conta de usuário e todas as suas informações pessoais associadas.</p>

  <div class="warning-box">
    <p><strong style="color: #FFFFFF;">Atenção:</strong> A exclusão de sua conta é permanente e irreversível. Todos os dados associados a ela serão deletados de forma definitiva dos nossos servidores ativos.</p>
  </div>

  <h2>1. Como solicitar a exclusão da sua conta e dados</h2>
  <p>Você pode excluir sua conta de duas maneiras:</p>
  
  <h3>Opção A: Diretamente pelo Aplicativo (Exclusão Imediata)</h3>
  <ol>
    <li>Abra o aplicativo <span class="highlight">XamaJá</span> e acesse sua conta.</li>
    <li>Navegue até a aba <span class="highlight">Perfil</span> (no menu inferior).</li>
    <li>Toque no botão <span class="highlight">Editar Perfil</span>.</li>
    <li>Role a página até o fim e toque na opção vermelha <span class="highlight">Excluir minha conta</span>.</li>
    <li>Confirme a ação no alerta de segurança. Sua conta e dados serão apagados instantaneamente do banco de dados.</li>
  </ol>

  <h3>Opção B: Por E-mail (Suporte Técnico)</h3>
  <ol>
    <li>Envie uma mensagem eletrônica para o e-mail: <a href="mailto:suporte.xamaja@gmail.com" style="color: #22C55E;">suporte.xamaja@gmail.com</a>.</li>
    <li>Insira como assunto: <span class="highlight">Exclusão de Conta - XamaJá</span>.</li>
    <li>Informe o endereço de e-mail ou identificador de login utilizado na sua conta do app.</li>
    <li>Nossa equipe de suporte processará a exclusão dos seus dados em até <span class="highlight">5 dias úteis</span> e retornará com a confirmação de exclusão.</li>
  </ol>

  <h2>2. Quais dados são excluídos?</h2>
  <p>Ao solicitar a exclusão da conta, apagamos permanentemente do nosso banco de dados principal:</p>
  <ul>
    <li>Nome do usuário e endereço de e-mail de cadastro.</li>
    <li>Foto de perfil e fotos cadastradas.</li>
    <li>Lista de prestadores de serviços marcados como Favoritos.</li>
    <li>Histórico de endereços de localização salvos.</li>
    <li>Cadastro de prestador de serviços (caso possua), incluindo telefone de contato público, descrição do negócio e fotos do portfólio.</li>
    <li>Registro de conta no sistema de autenticação Supabase/Firebase Auth.</li>
  </ul>

  <h2>3. Quais dados são retidos e por quanto tempo?</h2>
  <p>Para cumprir exigências legais de contabilidade e combate à fraude, retemos as seguintes informações:</p>
  <ul>
    <li><span class="highlight">Histórico de Transações Financeiras:</span> Os registros de pagamentos efetuados por prestadores de serviços para contratação de planos Premium (mensal ou anual) são armazenados no banco de dados com fins fiscais em conformidade com as leis tributárias locais pelo período de retenção legal exigido, sendo eliminados de forma definitiva após esse prazo.</li>
    <li>Não coletamos ou retemos quaisquer dados confidenciais de cartões de crédito, pois todas as transações são efetuadas e protegidas diretamente pelo gateway externo do <span class="highlight">Mercado Pago</span>.</li>
  </ul>

  <h2>4. Exclusão parcial de dados (Sem exclusão de conta)</h2>
  <p>Se você deseja excluir apenas parte de suas informações sem excluir sua conta:</p>
  <ul>
    <li>Você pode gerenciar e excluir endereços salvos diretamente na seção de endereços em seu perfil.</li>
    <li>Você pode remover prestadores de serviços favoritos a qualquer momento clicando no ícone de coração nos perfis dos profissionais.</li>
  </ul>

  <h2>5. Contato de Suporte</h2>
  <p>Caso tenha qualquer dúvida técnica ou de privacidade, entre em contato:</p>
  <p>E-mail: <a href="mailto:suporte.xamaja@gmail.com" style="color: #22C55E;">suporte.xamaja@gmail.com</a></p>

  <div class="footer">
    &copy; 2026 XamaJá - Todos os direitos reservados.
  </div>
</body>
</html>`;
}

export function getTermsOfUseHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termos de Uso - XamaJá</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #D1D5DB;
      background-color: #080808;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      color: #FFFFFF;
      font-size: 2rem;
      border-bottom: 2px solid #1C1C1E;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #22C55E;
      font-size: 1.4rem;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    p, li {
      color: #9CA3AF;
      font-size: 1rem;
    }
    ul, ol {
      padding-left: 20px;
      margin-bottom: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #1C1C1E;
      font-size: 0.85rem;
      color: #6B7280;
      text-align: center;
    }
    .highlight {
      color: #FFFFFF;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <h1>Termos de Uso do XamaJá</h1>
  <p>Última atualização: 15 de junho de 2026</p>

  <p>Ao utilizar o aplicativo ou website <span class="highlight">XamaJá</span>, você declara estar ciente e concorda integralmente com os seguintes Termos de Uso.</p>

  <h2>1. Sobre a Plataforma</h2>
  <p>O XamaJá é uma plataforma digital que atua como um facilitador de conexões, aproximando clientes que buscam serviços de profissionais autônomos, prestadores de serviços e estabelecimentos comerciais locais na sua região geográfica.</p>

  <h2>2. Cadastro e Responsabilidades</h2>
  <p>O usuário é inteiramente responsável pela veracidade e precisão de todas as informações inseridas no momento do seu cadastro.</p>
  <p>É expressamente proibido:</p>
  <ul>
    <li>Utilizar dados e informações falsas de identificação ou contato.</li>
    <li>Criar contas fraudulentas, duplicadas ou se passar por outro profissional/negócio.</li>
    <li>Praticar quaisquer atividades de caráter ilegal, abusivo ou fraudulento.</li>
  </ul>

  <h2>3. Relação de Intermediação</h2>
  <p>Os prestadores e comércios cadastrados são comercialmente e civilmente responsáveis pela qualidade, execução, precificação, garantias e entrega dos serviços e produtos oferecidos.</p>
  <p>O XamaJá <span class="highlight">não possui qualquer vínculo empregatício, de representação ou de sociedade</span> com os prestadores cadastrados. O aplicativo funciona estritamente como um catálogo dinâmico de contato direto.</p>

  <h2>4. Pagamentos e Taxas</h2>
  <p>A contratação e o pagamento dos serviços são combinados diretamente entre cliente e profissional de forma privada (ex: via WhatsApp ou presencial).</p>
  <p>O XamaJá poderá cobrar taxas de assinatura dos prestadores de serviço para a ativação de visibilidade prioritária (Planos Premium), em conformidade com as tabelas de preços vigentes na plataforma.</p>

  <h2>5. Avaliações de Usuários</h2>
  <p>Os clientes podem avaliar os serviços recebidos atribuindo estrelas e comentários. O XamaJá reserva-se o direito de remover comentários que contenham linguagem ofensiva, preconceituosa, discriminatória ou que caracterizem informações sabidamente falsas.</p>

  <h2>6. Suspensão e Banimento de Contas</h2>
  <p>O XamaJá reserva-se o direito de suspender temporariamente ou banir de forma definitiva contas de usuários ou prestadores que:</p>
  <ul>
    <li>Violem as cláusulas estabelecidas nestes Termos de Uso ou na Política de Privacidade.</li>
    <li>Pratiquem condutas inadequadas ou golpes comprovados contra outros usuários.</li>
    <li>Prejudiquem o bom funcionamento e integridade operacional da plataforma.</li>
  </ul>

  <h2>7. Alterações dos Termos</h2>
  <p>Estes Termos de Uso poderão ser alterados a qualquer momento pela equipe de desenvolvimento para refletir atualizações legais ou novas ferramentas do sistema. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.</p>

  <h2>8. Contato e Suporte</h2>
  <p>Para dúvidas legais ou problemas com o aplicativo, entre em contato:</p>
  <p>E-mail: <a href="mailto:suporte.xamaja@gmail.com" style="color: #22C55E;">suporte.xamaja@gmail.com</a></p>

  <div class="footer">
    &copy; 2026 XamaJá - Todos os direitos reservados.
  </div>
</body>
</html>`;
}
