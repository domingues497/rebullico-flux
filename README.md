# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/57028676-3303-4b50-a95e-519f4724fea0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/57028676-3303-4b50-a95e-519f4724fea0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/57028676-3303-4b50-a95e-519f4724fea0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)




Estrutura de Requisitos para o ERP Rebulliço
Aqui está uma proposta completa, pensada para uma loja de roupas moderna e com foco inicial em dispositivos móveis.
Módulo 1: Cadastro e Configurações/Parametrização da Loja
Este módulo é a base de todo o sistema, onde as informações centrais da empresa são definidas.
Requisitos Funcionais (RF)
 * RF1.1: O sistema deve permitir o cadastro dos dados da empresa (CNPJ, Razão Social, Nome Fantasia, Inscrição Estadual, Endereço).
 * RF1.2: O sistema deve permitir o cadastro de múltiplas lojas (filiais), caso existam, vinculadas à mesma empresa.
 * RF1.3: O sistema deve permitir a configuração de horários de funcionamento da loja, que podem ser usados em relatórios ou integrações.
 * RF1.4: O sistema deve permitir a criação e gerenciamento de perfis de usuário (Ex: Administrador, Vendedor, Estoquista, Caixa).
 * RF1.5: O sistema deve permitir a associação de permissões de acesso específicas para cada perfil de usuário (Ex: Vendedor só pode acessar o PDV e consultar estoque).
 * RF1.6: O sistema deve permitir o cadastro de usuários, associando-os a um perfil e a uma loja específica.
 * RF1.7: O sistema deve permitir a configuração de parâmetros de aparência do sistema, como o logotipo da "Rebulliço" e cores primárias, para personalizar a interface.
 * RF1.8: O sistema deve permitir a configuração de integrações básicas, como a chave de API para um gateway de pagamento ou para uma transportadora.
 * RF1.9: O sistema deve possuir uma funcionalidade de "esqueci minha senha" que envie um link de redefinição para o e-mail cadastrado do usuário.
 * RF1.10: O sistema deve registrar logs de atividades importantes dos usuários (Ex: quem alterou o cadastro de um produto, quem excluiu uma venda).
Requisitos Não Funcionais (RNF)
 * RNF1.1 (Usabilidade): A interface deve ser intuitiva e responsiva, adaptando-se perfeitamente a telas de smartphones, tablets e desktops (Mobile First).
 * RNF1.2 (Segurança): Senhas de usuários devem ser armazenadas de forma criptografada no banco de dados.
 * RNF1.3 (Desempenho): As telas de cadastro e configuração devem carregar em no máximo 3 segundos.
 * RNF1.4 (Disponibilidade): O sistema deve estar disponível 99.5% do tempo.
 * RNF1.5 (Compatibilidade): O sistema web deve ser compatível com as duas últimas versões dos navegadores Google Chrome, Mozilla Firefox e Safari.
 * RNF1.6 (Escalabilidade): A arquitetura deve suportar o cadastro de até 100 filiais e 1.000 usuários sem degradação de performance.
 * RNF1.7 (Manutenibilidade): O código-fonte deve seguir padrões de projeto (Ex: MVC) para facilitar futuras manutenções e evoluções.
 * RNF1.8 (Localização): O sistema deve ser desenvolvido em Português do Brasil (pt-BR).
 * RNF1.9 (Segurança): O sistema deve implementar controle de acesso baseado em perfis (Role-Based Access Control - RBAC).
 * RNF1.10 (Confiabilidade): O sistema deve garantir a integridade dos dados, prevenindo a exclusão de um perfil de usuário que já esteja em uso.

Regras de Negócio (RN)
 * RN1.1: O CNPJ da empresa é único e obrigatório.
 * RN1.2: Todo usuário deve estar associado a um, e somente um, perfil de acesso.
 * RN1.3: O perfil "Administrador" não pode ser excluído.
 * RN1.4: Um usuário só pode ser cadastrado com um e-mail único no sistema.
 * RN1.5: Novas lojas cadastradas iniciam com o status "Inativa" e devem ser ativadas por um administrador.
 * RN1.6: Apenas um Administrador pode criar, editar ou excluir perfis de acesso.
 * RN1.7: Apenas um Administrador pode alterar os dados cadastrais da empresa.
 * RN1.8: A senha de um novo usuário deve ter no mínimo 8 caracteres, contendo letras e números.
 * RN1.9: As permissões de acesso são herdadas do perfil; não é possível dar permissão individual a um usuário.
 * RN1.10: O log de atividades não pode ser alterado ou excluído por nenhum perfil de usuário.

Módulo 2: Cadastro e Configuração do Módulo Financeiro
Foco na gestão do dinheiro que entra e sai da loja.
Requisitos Funcionais (RF)
 * RF2.1: O sistema deve permitir o cadastro de contas bancárias da empresa (banco, agência, conta).
 * RF2.2: O sistema deve permitir o cadastro de formas de pagamento aceitas pela loja (Dinheiro, Cartão de Crédito, Cartão de Débito, Pix, Boleto, Crediário da Loja).
 * RF2.3: O sistema deve permitir a configuração de taxas para cada forma de pagamento (Ex: taxa de 2% para vendas no crédito).
 * RF2.4: O sistema deve permitir a configuração de planos de contas (categorias de receitas e despesas, Ex: Receita de Vendas, Despesa com Aluguel, Despesa com Marketing).
 * RF2.5: O sistema deve permitir o cadastro de centros de custo (Ex: Loja Física, E-commerce), para vincular receitas e despesas.
 * RF2.6: O sistema deve permitir o lançamento manual de contas a pagar (Ex: aluguel, fornecedores).
 * RF2.7: O sistema deve permitir o lançamento manual de contas a receber (Ex: pagamentos pendentes).
 * RF2.8: O sistema deve permitir a baixa (liquidação) de contas a pagar e a receber, informando a data e o valor pago/recebido.
 * RF2.9: O sistema deve gerar um relatório de fluxo de caixa diário, semanal e mensal.
 * RF2.10: O sistema deve permitir a conciliação bancária, comparando os lançamentos do sistema com o extrato do banco.
Requisitos Não Funcionais (RNF)
 * RNF2.1 (Precisão): Cálculos financeiros (juros, taxas, totais) devem ter precisão de duas casas decimais.
 * RNF2.2 (Segurança): O acesso a relatórios financeiros e configurações deve ser restrito a perfis autorizados (Administrador, Financeiro).
 * RNF2.3 (Desempenho): A geração de um relatório de fluxo de caixa mensal não deve levar mais de 10 segundos.
 * RNF2.4 (Confiabilidade): Transações financeiras devem ser atômicas (ou completam com sucesso ou são totalmente revertidas em caso de falha).
 * RNF2.5 (Usabilidade): A interface para lançamento de contas deve ser simples e rápida, com preenchimento automático de campos sempre que possível.
 * RNF2.6 (Integração): O sistema deve ser capaz de exportar relatórios financeiros para formatos como CSV e PDF.
 * RNF2.7 (Auditoria): Todas as alterações em lançamentos financeiros (contas a pagar/receber) devem ser registradas em um log de auditoria.
 * RNF2.8 (Escalabilidade): O banco de dados deve ser otimizado para suportar um grande volume de transações financeiras diárias.
 * RNF2.9 (Disponibilidade): O módulo financeiro deve estar acessível para consulta e lançamento 24/7.
 * RNF2.10 (Segurança): A comunicação entre o navegador e o servidor deve ser criptografada com SSL/TLS em todas as telas do módulo financeiro.
Regras de Negócio (RN)
 * RN2.1: Uma forma de pagamento não pode ser excluída se já foi utilizada em uma venda.
 * RN2.2: Todo lançamento financeiro (receita ou despesa) deve estar associado a um plano de contas.
 * RN2.3: Não é permitido lançar uma despesa com data futura.
 * RN2.4: Ao dar baixa em uma conta, o valor pago não pode ser superior ao valor devido.
 * RN2.5: Contas a receber geradas a partir de vendas no PDV (crediário) devem ser criadas automaticamente.
 * RN2.6: O sistema deve alertar o usuário sobre contas a pagar e a receber que estão vencendo nos próximos 3 dias.
 * RN2.7: Um plano de contas só pode ser excluído se não houver lançamentos associados a ele.
 * RN2.8: Ao configurar uma forma de pagamento parcelada, o sistema deve solicitar o número máximo de parcelas e a taxa de juros, se houver.
 * RN2.9: O fluxo de caixa deve considerar o prazo de recebimento das vendas com cartão de crédito (Ex: D+30).
 * RN2.10: O saldo inicial do caixa do dia deve ser igual ao saldo final do caixa do dia anterior.
 
Módulo 3: Cadastro de Cliente, Fornecedor e Funcionário
Gerenciamento de todas as pessoas e empresas que se relacionam com a loja.
Requisitos Funcionais (RF)
 * RF3.1: O sistema deve permitir o cadastro completo de clientes (Pessoa Física e Jurídica), incluindo nome/razão social, CPF/CNPJ, e-mail, telefone e endereço.
 * RF3.2: O sistema deve permitir o cadastro completo de fornecedores, incluindo nome, CNPJ, contato e endereço.
 * RF3.3: O sistema deve permitir o cadastro de funcionários, incluindo dados pessoais, cargo, salário e data de admissão.
 * RF3.4: O sistema deve permitir a busca de clientes, fornecedores e funcionários por nome, CPF/CNPJ ou código.
 * RF3.5: O sistema deve exibir o histórico de compras de um cliente ao acessar seu cadastro.
 * RF3.6: O sistema deve exibir o histórico de produtos fornecidos por um fornecedor.
 * RF3.7: O sistema deve permitir a desativação de cadastros (clientes, fornecedores, funcionários) sem excluí-los do banco de dados para manter a integridade dos históricos.
 * RF3.8: O sistema deve permitir a segmentação de clientes por tags (Ex: "Cliente VIP", "Compra online", "Prefere Jeans").
 * RF3.9: O sistema deve ter uma funcionalidade de importação de clientes a partir de uma planilha (CSV).
 * RF3.10: O sistema deve permitir o vínculo entre o cadastro de funcionário e o cadastro de usuário do sistema.
Requisitos Não Funcionais (RNF)
 * RNF3.1 (LGPD): O sistema deve estar em conformidade com a Lei Geral de Proteção de Dados, garantindo a segurança e a privacidade dos dados cadastrados.
 * RNF3.2 (Desempenho): A busca por um cliente por CPF deve retornar o resultado em menos de 2 segundos.
 * RNF3.3 (Usabilidade): A interface de cadastro deve ser limpa e organizada, com validação de campos em tempo real (Ex: formato de CPF/CNPJ e e-mail).
 * RNF3.4 (Integração): O sistema deve possuir uma API para permitir a consulta de dados de clientes por outros sistemas (Ex: e-commerce).
 * RNF3.5 (Confiabilidade): O sistema deve criar backups diários do banco de dados de cadastros.
 * RNF3.6 (Escalabilidade): A estrutura deve suportar o cadastro de pelo menos 50.000 clientes sem perda de performance nas buscas.
 * RNF3.7 (Segurança): Apenas usuários com permissão podem visualizar dados sensíveis como salário de funcionários.
 * RNF3.8 (Disponibilidade): O cadastro de clientes deve estar sempre disponível, especialmente durante o horário de funcionamento da loja.
 * RNF3.9 (Manutenibilidade): A lógica de validação de CPF e CNPJ deve ser implementada em um módulo separado para ser reutilizada em outras partes do sistema.
 * RNF3.10 (Compatibilidade): A funcionalidade de busca de endereço por CEP deve ser compatível com serviços de consulta online (Ex: ViaCEP).
Regras de Negócio (RN)
 * RN3.1: CPF e CNPJ devem ser únicos na base de dados de clientes, fornecedores e funcionários. O sistema deve validar o dígito verificador.
 * RN3.2: Um novo cliente cadastrado no Ponto de Venda deve ser automaticamente salvo no banco de dados central.
 * RN3.3: Não é possível excluir um cliente que já tenha realizado uma compra. Apenas desativá-lo.
 * RN3.4: Não é possível excluir um fornecedor se houver notas de entrada ou produtos vinculados a ele.
 * RN3.5: Um funcionário desligado deve ter seu status alterado para "Inativo" e seu usuário de sistema bloqueado.
 * RN3.6: A data de admissão de um funcionário não pode ser posterior à data atual.
 * RN3.7: O campo "e-mail" é obrigatório para clientes que desejam receber notas fiscais eletrônicas.
 * RN3.8: Um cliente se torna "Cliente VIP" automaticamente após atingir um valor total de compras de R$ 2.000,00 no ano.
 * RN3.9: O sistema não deve permitir o cadastro de clientes menores de 16 anos sem o CPF de um responsável.
 * RN3.10: Ao cadastrar um funcionário com perfil de "Vendedor", o sistema deve automaticamente criar um usuário de sistema vinculado a ele.
 
Módulo 4: Cadastro de Produtos
O coração do negócio de uma loja de roupas.
Requisitos Funcionais (RF)
 * RF4.1: O sistema deve permitir o cadastro de produtos com informações como: Nome, Descrição, Código de Barras (SKU), Fornecedor, Marca, Categoria (Ex: Camisa, Calça), Subcategoria (Ex: Manga Longa, Jeans Skinny).
 * RF4.2: O sistema deve suportar o cadastro de produtos com variações, como Cor e Tamanho (P, M, G, 38, 40, etc.), gerando um SKU único para cada variação.
 * RF4.3: O sistema deve permitir o upload de múltiplas fotos para cada produto/variação.
 * RF4.4: O sistema deve permitir a definição de Preço de Custo, Preço de Venda e Margem de Lucro.

  - O preço de venda de um produto deve ser calculado a partir do preço de custo informado.
  - O sistema deve aplicar a fórmula:
Preço de Venda = Preço de Custo ÷ (1 – Margem de Lucro)

 * RF4.5: O sistema deve permitir a configuração de impostos (NCM, CFOP) por produto para emissão fiscal.
 * RF4.6: O sistema deve permitir a geração e impressão de etiquetas de código de barras para os produtos.
 * RF4.7: O sistema deve permitir a criação de "kits" ou "combos" de produtos (Ex: Kit "Leve 3, Pague 2").
 * RF4.8: O sistema deve ter uma funcionalidade de busca e filtro de produtos por nome, SKU, categoria ou marca.
 * RF4.9: O sistema deve permitir a importação de produtos em lote via planilha (CSV).
 * RF4.10: O sistema deve permitir a definição de um "estoque mínimo" para cada produto/variação.
 * RF4.11: O sistema deve permitir o mapeamento de categorias de produtos do ERP para as categorias do Mercado Livre.
 * RF4.12: O sistema deve ter uma funcionalidade para "Publicar no Mercado Livre", enviando fotos, título, descrição, preço e variações (cor, tamanho) para o marketplace via API.
 * RF4.13: O sistema deve permitir a edição de um anúncio no Mercado Livre diretamente pela tela de cadastro do produto no ERP.
 * RF4.14: O sistema deve permitir definir um preço de venda específico para a Landing Page e outro para o Mercado Livre, diferente do preço da loja física.

Requisitos Não Funcionais (RNF)
 * RNF4.1 (Desempenho): A busca de um produto pelo leitor de código de barras deve ser instantânea (menos de 1 segundo).
 * RNF4.2 (Usabilidade): O formulário de cadastro de produtos com variações deve ser dinâmico, permitindo adicionar cores e tamanhos de forma fácil e intuitiva em uma única tela.
 * RNF4.3 (Armazenamento): O sistema deve otimizar as imagens dos produtos para um carregamento rápido sem perda significativa de qualidade.
 * RNF4.4 (Disponibilidade): A consulta de produtos deve estar sempre disponível, especialmente para o PDV.
 * RNF4.5 (Integração): O cadastro de produtos deve ser capaz de sincronizar com uma plataforma de e-commerce.
 * RNF4.6 (Confiabilidade): O sistema não deve permitir o cadastro de dois produtos ou variações com o mesmo SKU.
 * RNF4.7 (Escalabilidade): A arquitetura deve suportar um catálogo com mais de 100.000 SKUs diferentes.
 * RNF4.8 (Segurança): Apenas usuários autorizados podem alterar o preço de custo e o preço de venda dos produtos.
 * RNF4.9 (Manutenibilidade): As categorias e marcas devem ser gerenciadas em tabelas separadas para facilitar a manutenção e evitar redundância.
 * RNF4.10 (Compatibilidade): As etiquetas geradas devem seguir um padrão de mercado (Ex: EAN-13) e ser compatíveis com as impressoras térmicas mais comuns.
 * RNF4.11 (Integração): A comunicação com a API do Mercado Livre deve ser segura, utilizando os padrões de autenticação (OAuth 2.0) definidos pelo marketplace.
 * RNF4.12 (Confiabilidade): O sistema deve registrar logs detalhados de todas as operações de sincronização com o Mercado Livre (sucessos e falhas).

Regras de Negócio (RN)
 * RN4.1: Todo produto deve pertencer a uma categoria e a um fornecedor.
 * RN4.2: O SKU (código de barras) é único para cada variação de produto (Ex: Camisa Rebulliço Azul M tem um SKU, Camisa Rebulliço Azul G tem outro).
 * RN4.3: O Preço de Venda não pode ser menor que o Preço de Custo.
 * RN4.4: Ao alterar o preço de venda de um produto, o sistema deve registrar a data e o usuário que realizou a alteração.
 * RN4.5: Um produto não pode ser excluído se já tiver movimentação de estoque ou se estiver em uma venda. Ele pode ser apenas inativado.
 * RN4.6: O sistema deve sugerir um preço de venda baseado na margem de lucro padrão definida nas configurações da loja.
 * RN4.7: Ao cadastrar um novo produto, seu estoque inicial é zero. A entrada é feita pelo módulo de Controle de Estoque.
 * RN4.8: O sistema deve emitir um alerta na tela inicial para produtos que atingiram o estoque mínimo.
 * RN4.9: A categoria "Promoção" não pode ser atribuída a produtos com margem de lucro acima de 30%.
 * RN4.10: Para criar um kit, os produtos componentes devem estar previamente 
 * RN4.11: Apenas produtos com o status "Ativo" e com estoque maior que zero pode ser publicados ou ter seu status atualizado como "Ativo" no Mercado Livre.
 * RN4.12: Alterações no título, preço ou descrição de um produto no ERP devem ser refletidas no anúncio correspondente do Mercado Livre em até 5 minutos.
 
Cadastrados e com estoque disponível.
Módulo 5: Controle de Estoque
Gerencia o fluxo de entrada e saída de mercadorias.
Requisitos Funcionais (RF)
 * RF5.1: O sistema deve permitir o lançamento de notas fiscais de entrada de fornecedores, atualizando o estoque dos produtos automaticamente.
 * RF5.2: O sistema deve permitir a realização de transferências de estoque entre lojas (filiais).
 * RF5.3: O sistema deve permitir ajustes manuais de estoque (entrada e saída) com um campo obrigatório para justificativa (Ex: Perda, Roubo, Doação).
 * RF5.4: O sistema deve fornecer uma ferramenta para realização de inventário de estoque utilizando a câmera do celular/tablet como leitor de código de barras para agilizar a contagem física.
 * RF5.5: O sistema deve gerar um relatório de posição de estoque atual, com filtros por produto, categoria, marca e fornecedor.
 * RF5.6: O sistema deve gerar um relatório de movimentação de estoque (Kardex) para um produto específico, mostrando todas as entradas e saídas em um período.
 * RF5.7: O sistema deve dar baixa no estoque automaticamente quando uma venda for concluída no PDV.
 * RF5.8: Em caso de devolução de um produto pelo cliente, o sistema deve permitir o retorno do item ao estoque.
 * RF5.9: O sistema deve calcular o Custo Médio do produto a cada nova entrada com preço de custo diferente.
 * RF5.10: O sistema deve exibir alertas visuais para produtos com estoque baixo ou zerado.
 * RF5.11: O sistema deve sincronizar o estoque dos produtos em tempo real com o Mercado Livre. Uma venda na loja física deve abater o estoque no marketplace, e vice-versa.
 * RF5.12: O sistema deve importar automaticamente os pedidos de venda do Mercado Livre, abatendo o estoque correspondente e criando uma ordem de separação.
Requisitos Não Funcionais (RNF)
 * RNF5.1 (Confiabilidade): As atualizações de estoque devem ser transacionais para garantir a consistência dos dados, especialmente durante as vendas.
 * RNF5.2 (Desempenho): A consulta de estoque de um item no PDV deve ser instantânea.
 * RNF5.3 (Usabilidade): A tela de inventário deve ser otimizada para uso em dispositivos móveis (smartphones ou coletores de dados) com leitor de código de barras.
 * RNF5.4 (Segurança): Apenas perfis autorizados (Estoquista, Administrador) podem realizar ajustes manuais de estoque.
 * RNF5.5 (Auditoria): Todas as movimentações de estoque (entradas, saídas, ajustes, transferências) devem ser registradas com data, hora e usuário responsável.
 * RNF5.6 (Escalabilidade): O sistema deve conseguir processar a baixa de estoque de centenas de vendas simultâneas em períodos de alta demanda (Ex: Black Friday).
 * RNF5.7 (Disponibilidade): O serviço de controle de estoque deve ter alta disponibilidade para não impedir a realização de vendas.
 * RNF5.8 (Precisão): O sistema deve garantir que o controle de estoque seja preciso, evitando inconsistências entre o estoque físico e o lógico.
 * RNF5.9 (Integração): O módulo de estoque deve se comunicar em tempo real com o PDV e, futuramente, com a plataforma de e-commerce.
 * RNF5.10 (Recuperabilidade): O sistema deve ter rotinas de backup que permitam a recuperação do estado do estoque em caso de falha grave.
Regras de Negócio (RN)
 * RN5.1: Não é possível vender um produto com estoque zerado, a menos que a venda sob encomenda seja permitida nas configurações da loja.
 * RN5.2: Uma transferência de estoque entre lojas só é confirmada quando a loja de destino acusa o recebimento dos produtos. Enquanto isso, o estoque fica em "trânsito".
 * RN5.3: Todo ajuste manual de estoque com diferença superior a 5 itens requer aprovação de um gerente/administrador.
 * RN5.4: A devolução de um produto com defeito deve direcionar o item para um estoque de "Avaria", não para o estoque de venda.
 * RN5.5: O relatório de necessidade de reposição deve ser gerado com base nos produtos que atingiram o estoque mínimo.
 * RN5.6: Ao dar entrada em uma nota fiscal, se o preço de custo do produto for 10% maior que o da última compra, o sistema deve emitir um alerta.
 * RN5.7: O inventário só pode ser iniciado fora do horário de vendas para evitar inconsistências.
 * RN5.8: O estoque de um kit/combo é determinado pelo componente com o menor número de itens disponíveis.
 * RN5.9: Produtos inativados não devem aparecer nos relatórios de posição de estoque para venda.
 * RN5.10: A saída de estoque por venda só é confirmada após a aprovação do pagamento. Vendas canceladas devem reverter a baixa do estoque.
 * RN5.11: Ao receber um pedido do Mercado Livre, o sistema deve reservar o estoque do produto para evitar que ele seja vendido na loja física simultaneamente ("estoque fantasma").
 * RN5.12: Se a sincronização de estoque com o Mercado Livre falhar, o sistema deve tentar novamente a cada 10 minutos e notificar um administrador após 3 tentativas sem sucesso.



 
Módulo 6: Ponto de Venda (PDV)
A interface de finalização das vendas, o contato direto com o cliente.
Requisitos Funcionais (RF)
 * RF6.1: O sistema deve permitir a busca de produtos utilizando a câmera do celular/tablet como leitor de código de barras, além do leitor USB tradicional.
 * RF6.2: O sistema deve permitir adicionar produtos ao carrinho de compras, exibindo o subtotal em tempo real.
 * RF6.3: O sistema deve permitir a aplicação de descontos por item ou no valor total da venda (em percentual ou valor fixo).
 * RF6.4: O sistema deve permitir a identificação do cliente na venda (por CPF ou nome).
 * RF6.5: O sistema deve permitir a seleção de múltiplas formas de pagamento para uma única venda (Ex: parte em dinheiro, parte em cartão).
 * RF6.6: O sistema deve calcular o troco automaticamente para pagamentos em dinheiro.
 * RF6.7: O sistema deve permitir a emissão de cupom fiscal (NFC-e) ou documento não fiscal.
 * RF6.8: O sistema deve permitir o registro de trocas e devoluções de produtos, gerando um crédito para o cliente ou estornando o valor.
 * RF6.9: O sistema deve ter funcionalidades de abertura e fechamento de caixa, com relatório de sangria (retirada) e suprimento (acréscimo).
 * RF6.10: O sistema deve permitir que a venda fique em espera ("venda pendente") para que o operador possa atender outro cliente e retornar a ela depois.
 * RF6.11: O sistema deve ser integrado com a API do PIX Sicredi para:
   a) Gerar um QR Code dinâmico com o valor da venda.
   b) Consultar o status do pagamento em tempo real.
   c) Confirmar o recebimento do PIX para finalizar a venda.
 * RF6.12: O sistema deve imprimir automaticamente um cupom não fiscal em uma impressora térmica ao final de cada venda com pagamento confirmado.

Requisitos Não Funcionais (RNF)
 * RNF6.1 (Usabilidade / Mobile First): A interface do PDV deve ser extremamente simples, rápida e otimizada para telas de toque. A ativação da câmera para leitura de código de barras deve ser acessível por um único toque.
 * RNF6.2 (Desempenho): O tempo entre a leitura do código de barras e a exibição do produto na tela deve ser inferior a 500 milissegundos.
 * RNF6.3 (Disponibilidade / Offline First): O PDV deve ser capaz de operar em modo offline, registrando as vendas localmente e sincronizando com o servidor central assim que a conexão com a internet for restabelecida.
 * RNF6.4 (Segurança): Apenas usuários com perfil "Caixa" ou "Gerente" podem operar o PDV. A aplicação de descontos acima de um certo percentual pode exigir senha de gerente.
 * RNF6.5 (Compatibilidade): O PDV deve ser compatível com periféricos comuns e com as câmeras frontais e traseiras de dispositivos Android e iOS. A impressão automática deve ser compatível com impressoras térmicas de 58mm e 80mm.
 * RNF6.6 (Confiabilidade): O sistema deve garantir que uma venda, uma vez finalizada, não possa ser alterada, apenas cancelada por um usuário autorizado, gerando um registro de estorno.
 * RNF6.7 (Integração): O PDV deve estar totalmente integrado em tempo real com os módulos de Estoque, Financeiro e Cadastro de Clientes.
 * RNF6.8 (Escalabilidade): O sistema deve suportar múltiplos caixas operando simultaneamente na mesma loja ou em filiais diferentes.
 * RNF6.9 (Recuperabilidade): Em caso de queda de energia ou travamento do sistema, o PDV deve ser capaz de recuperar a venda que estava em andamento.
 * RNF6.10 (Precisão): Todos os cálculos de totais, descontos, juros e troco devem ser exatos.
 * RNF6.11 (Segurança): A comunicação com a API do PIX Sicredi deve ser criptografada e as chaves de acesso à API devem ser armazenadas de forma segura no servidor.
 * RNF6.12 (Desempenho): A geração do QR Code do PIX deve ser instantânea. A consulta do status do pagamento não deve levar mais de 5 segundos.
Regras de Negócio (RN)
 * RN6.1: Descontos acima de 15% no total da venda exigem autorização (senha) de um gerente.
 * RN6.2: A troca de um produto só é permitida mediante apresentação do cupom fiscal e dentro do prazo de 30 dias.
 * RN6.3: Produtos de promoção/liquidação não podem ser trocados.
 * RN6.4: Ao fechar o caixa, a diferença entre o valor registrado no sistema e o valor contado na gaveta deve ser justificada.
 * RN6.5: O sistema deve sugerir a identificação do cliente (CPF na nota) para todas as vendas acima de R$ 200,00.
 * RN6.6: Uma venda só pode ser cancelada no mesmo dia em que foi realizada e antes do fechamento do caixa.
 * RN6.7: Para vendas no crediário da loja, o cliente deve ter seu cadastro completo e um limite de crédito aprovado.
 * RN6.8: O sistema não deve permitir a abertura de um novo caixa sem que o do dia anterior tenha sido fechado.
 * RN6.9: Na devolução de um produto, se o pagamento original foi em cartão de crédito, o estorno deve ser feito pela máquina do cartão, e o sistema deve apenas registrar a operação.
 * RN6.10: Cada venda deve ser associada ao vendedor que a realizou para fins de comissão.
 * RN6.11: Se o pagamento via PIX não for confirmado em até 2 minutos, a transação deve ser cancelada automaticamente e o operador do caixa notificado.
 * RN6.12: A impressão do cupom não fiscal é obrigatória para todas as vendas, exceto para aquelas que forem canceladas.
 * RN6.13: O sistema não permitirá a finalização da venda se a API do PIX Sicredi estiver indisponível, devendo o operador optar por outra forma de pagamento.

 
Módulo 7: Landing Page / Catálogo Público
Este novo módulo descreve a vitrine online de produtos, que funciona como um site institucional e catálogo para os clientes.
Requisitos Funcionais (RF)
 * RF7.1: O sistema deve gerar uma página web (Landing Page) pública e com design responsivo (mobile first).
 * RF7.2: A Landing Page deve exibir todos os produtos marcados como "Visível no Site" que possuam estoque maior que zero.
 * RF7.3: Cada produto na página deve exibir: fotos, nome, descrição, variações de cor e tamanho disponíveis, e o preço de venda para a Landing Page.
 * RF7.4: A página deve possuir filtros para que os clientes possam navegar por categoria, marca, faixa de preço, cor e tamanho.
 * RF7.5: A página deve ter uma funcionalidade de busca por nome ou descrição do produto.
 * RF7.6: Ao clicar em um produto, o cliente deve ver uma página de detalhes com todas as informações e fotos do item.
 * RF7.7: A Landing Page deve exibir informações de contato da loja (endereço, telefone/WhatsApp, redes sociais).
 * RF7.8: O sistema deve permitir a personalização básica da Landing Page, como o logotipo da "Rebulliço", banner principal e cores.
 * RF7.9: O estoque exibido na Landing Page deve ser atualizado em tempo real conforme as vendas ocorrem na loja física ou no Mercado Livre.
 * RF7.10: A página não terá funcionalidade de e-commerce (carrinho de compras/checkout), servindo como uma vitrine para direcionar o cliente à loja física ou a outros canais de venda.
Requisitos Não Funcionais (RNF)
 * RNF7.1 (Desempenho): A Landing Page deve ter um carregamento rápido, com as principais métricas (LCP, FID, CLS) do Google otimizadas (Core Web Vitals).
 * RNF7.2 (Disponibilidade): A página deve estar disponível 24/7.
 * RNF7.3 (SEO): A página deve ser otimizada para motores de busca (SEO), com URLs amigáveis, meta tags, e sitemap.xml gerado automaticamente.
 * RNF7.4 (Usabilidade): A navegação deve ser intuitiva e fácil para qualquer tipo de usuário.
 * RNF7.5 (Segurança): A página deve ser servida sob HTTPS.
 * RNF7.6 (Escalabilidade): A infraestrutura deve suportar picos de acesso sem degradação do serviço.
 * RNF7.7 (Integração): A página deve ser totalmente integrada ao banco de dados do ERP, sem necessidade de cadastros duplicados.
 * RNF7.8 (Compatibilidade): Deve ser compatível com os principais navegadores web em suas versões mais recentes.
 * RNF7.9 (Manutenibilidade): A gestão do conteúdo da página (produtos visíveis, banners) deve ser feita de forma simples através do painel administrativo do ERP.
 * RNF7.10 (Análise): A página deve permitir a integração com ferramentas de análise de tráfego, como o Google Analytics.
Regras de Negócio (RN)
 * RN7.1: Um produto só aparece na Landing Page se a opção "Visível no Site" estiver marcada no seu cadastro e seu estoque total for positivo.
 * RN7.2: Quando o estoque de um produto chega a zero, ele deve ser automaticamente removido da listagem na Landing Page.
 * RN7.3: O preço exibido deve ser o "Preço de Venda - Landing Page" definido no cadastro do produto. Se este não for definido, o sistema usará o "Preço de Venda" padrão da loja.
 * RN7.4: A ordem padrão de exibição dos produtos deve ser dos mais recentemente cadastrados para os mais antigos.
 * RN7.5: A Landing Page não processa pagamentos nem reservas. O objetivo é a divulgação.
 * RN7.6: As informações de contato exibidas na Landing Page são as mesmas do cadastro da loja principal no Módulo 1.
 * RN7.7: As fotos exibidas devem ser as mesmas carregadas no cadastro do produto.
 * RN7.8: A URL da Landing Page será um subdomínio ou domínio principal da "Rebulliço".
 * RN7.9: As variações de um produto (Ex: Tamanho P, Cor Azul) que estiverem com estoque zerado não devem ser selecionáveis na página de detalhes do produto.
 * RN7.10: O banner principal da página inicial pode ser alterado por um usuário administrador no painel do ERP.

