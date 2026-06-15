export function getPrivacyPolicyHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Privacidade - ChamaJá</title>
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
  <h1>Política de Privacidade do ChamaJá</h1>
  <p>Última atualização: 15 de junho de 2026</p>

  <p>Esta Política de Privacidade descreve como o aplicativo <span class="highlight">ChamaJá</span> coleta, usa e compartilha suas informações pessoais quando você utiliza nossos serviços.</p>

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
  <p>O ChamaJá valoriza a sua privacidade. Nós <span class="highlight">não vendemos ou alugamos</span> seus dados pessoais para terceiros.</p>
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
  <p>E-mail de suporte: <a href="mailto:suporte.chamaja@gmail.com" style="color: #22C55E;">suporte.chamaja@gmail.com</a></p>

  <div class="footer">
    &copy; 2026 ChamaJá - Todos os direitos reservados.
  </div>
</body>
</html>`;
}
