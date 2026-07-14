
# PROJETO — APLICAÇÃO WEB INTERNA DA MEDCONSULTORIA

> **Leia este documento inteiro antes de escrever qualquer linha de código.**
>
> Você (Claude Code) será o arquiteto principal desta aplicação.
>
> Não execute minhas ideias de forma cega.
>
> Sua principal função é analisar, criticar, melhorar, simplificar e tomar decisões técnicas melhores do que as minhas quando necessário.
>
> Sempre priorize:
>
> - simplicidade
> - performance
> - organização
> - escalabilidade
> - excelente UX
> - excelente UI
> - excelente DX
> - código limpo
> - arquitetura consistente
> - baixa manutenção
> - segurança
> - produtividade dos usuários
>
> Sempre que alguma ideia minha não fizer sentido, explique o motivo e proponha uma solução melhor.

---

# SOBRE O PROJETO

Esta aplicação **NÃO é um SaaS**.

Ela **NÃO será vendida**.

Ela é uma aplicação **interna da MedConsultoria**, desenvolvida para organizar completamente a empresa.

O objetivo é reduzir ao máximo o caos operacional da empresa.

A aplicação será utilizada inicialmente por:

- André/Thiago (root)
- Thaís (dona da empresa)
- funcionários
- posteriormente clientes da empresa através de um Portal do Cliente.

Ela ficará hospedada em:

**https://workspace.medconsultoria.com.br**

O site institucional continuará sendo separado.

---

# PRINCIPAL OBJETIVO

A aplicação deve se tornar o cérebro operacional da empresa.

Tudo deve acontecer dentro dela.

Hoje muitas informações ficam espalhadas em:

- WhatsApp
- e-mails
- agenda
- cadernos
- documentos
- memória
- planilhas

Queremos centralizar tudo.

A pergunta que devemos responder é:

> **"Como fazer a Thaís trabalhar com muito menos estresse?"**

Se alguma funcionalidade não ajudar nisso, provavelmente ela não deve existir agora.

---

# SUA LIBERDADE

Você possui liberdade para:

- melhorar arquitetura
- mudar estrutura
- reorganizar módulos
- sugerir funcionalidades
- remover funcionalidades ruins
- simplificar fluxos
- melhorar UX
- melhorar UI
- criar novas ideias

Você **NÃO** deve simplesmente obedecer.

Você deve agir como um arquiteto de software experiente.

Sempre critique ideias ruins.

Sempre proponha soluções melhores.

Sempre explique rapidamente quando decidir mudar alguma direção importante.

---

# STACK

Você pode escolher a stack.

Minha preferência inicial seria algo próximo de:

Frontend

- React
- TypeScript
- Vite

UI

- TailwindCSS
- shadcn/ui

Backend

- Node.js

Banco

- MySQL

ORM

- Prisma

Mas você pode alterar qualquer tecnologia caso exista uma opção claramente superior para este projeto.

Critérios:

- compatível com DirectAdmin
- compatível com Node.js
- compatível com Linux
- fácil deploy
- fácil manutenção
- excelente DX
- alta performance

Não utilizar .NET.

---

# HOSPEDAGEM

O projeto será hospedado na TineHost.

A TineHost utiliza DirectAdmin com suporte nativo a aplicações Node.js.

O banco será MySQL.

Toda arquitetura deve considerar este ambiente.

---

# IDENTIDADE VISUAL

Utilizar o mesmo Design System da MedConsultoria.

Tipografia:

Montserrat

Paleta principal:

Verde
#30AD73

Azul claro
#2DA8E1

Azul escuro
#002463

Azul textos
#003591

A identidade deve transmitir:

- confiança
- organização
- profissionalismo
- tecnologia
- simplicidade

Evitar interfaces poluídas.

Inspirar-se em:

- Linear
- Notion
- Slack
- ClickUp
- Perfex CRM
- Stripe Dashboard

Sem copiar.

---

# FILOSOFIA DO SISTEMA

O sistema deve ser extremamente intuitivo.

Um funcionário novo deve conseguir aprender praticamente sozinho.

Poucos cliques.

Fluxos claros.

Interface limpa.

Nada de telas cheias de informação inútil.

---

# USUÁRIOS

## ROOT

Thiago

André

Controle total.

Também acesso técnico.

---

## ADMIN

Thaís

Controle completo da empresa.

Sem funções técnicas.

---

## FUNCIONÁRIO

Acessa somente o necessário.

---

## CLIENTE

Quando um Lead virar Cliente, poderá receber acesso ao Portal do Cliente.

Ele verá apenas informações dele.

Nunca verá dados internos.

---

# MVP

Prioridade máxima.

---

## Dashboard

O Dashboard deve responder:

"O que precisa da minha atenção agora?"

Exemplos:

- tarefas atrasadas
- reuniões de hoje
- próximos vencimentos
- contas atrasadas
- projetos parados
- clientes aguardando retorno
- mensagens não lidas
- documentos pendentes

---

## CRM

Leads

Clientes

Contatos

Pipeline

Histórico

Anotações

Arquivos

Timeline

---

## Projetos

Cada cliente poderá possuir vários projetos.

Cada projeto terá:

- etapas
- tarefas
- responsáveis
- arquivos
- comentários
- documentos
- reuniões
- histórico

---

## Kanban

Inspirado no Perfex CRM.

Colunas:

Inbox

A Fazer

Em andamento

Aguardando Cliente

Aguardando Operadora

Concluído

Cada cartão deve possuir:

- checklist
- comentários
- anexos
- prazo
- responsável
- prioridade
- timer
- histórico

---

## Agenda

Compromissos

Retornos

Reuniões

Eventos

Lembretes

Compromissos pessoais da Thaís

Compromissos da empresa

Recorrências

---

## Financeiro

Muito importante.

Contas a pagar

Contas a receber

Receitas

Despesas

Recorrências

Categorias

Centro de custos

Anexos

Comprovantes

Fluxo de caixa

Alertas

---

## Mensagens Internas

Não integrar WhatsApp agora.

Criar um sistema interno.

Conversas:

- individuais
- grupos
- por projeto
- por cliente

Com:

- anexos
- notificações
- menções
- emojis (opcional)

---

## Portal do Cliente

Após virar cliente.

Poderá:

- acompanhar projetos
- acompanhar etapas
- baixar documentos
- visualizar contratos
- visualizar propostas
- enviar arquivos
- conversar com equipe
- acompanhar reuniões

---

## Reuniões

Não desenvolver sistema próprio de videoconferência.

Utilizar integração com links.

Exemplos:

Google Meet

Jitsi

Zoom

Whereby

No futuro isso poderá mudar.

---

## Timer

Inspirado no Perfex CRM.

Funcionário inicia.

Pausa.

Finaliza.

Registrar tempo gasto.

Gerar histórico.

Posteriormente gerar relatórios.

---

## Documentos Inteligentes

Um dos módulos mais importantes.

Criar modelos.

Exemplos:

- proposta
- contrato
- briefing
- escopo
- onboarding
- checklist
- ata
- relatório

Fluxo:

Selecionar cliente

Selecionar serviço

Selecionar modelo

IA gera documento

Usuário revisa

Salvar

Exportar PDF

Exportar DOCX

Enviar ao cliente

A IA nunca deve enviar documentos automaticamente.

Sempre haverá aprovação humana.

---

# IA

No futuro teremos IA integrada.

Desde já arquitetar pensando nisso.

Exemplos:

- preencher propostas
- preencher contratos
- resumir reuniões
- criar tarefas automaticamente
- criar briefing
- responder perguntas
- gerar documentos

Arquitetar para isso desde o início.

---

# O QUE NÃO FAZER AGORA

Não transformar em SaaS.

Não criar multi-tenant.

Não criar cobrança.

Não criar marketplace.

Não criar rede social.

Não criar EAD.

Não criar ERP gigante.

Não criar integrações complexas.

Primeiro resolver o problema da MedConsultoria.

---

# CÓDIGO

Priorizar:

SOLID

Clean Code

Componentização

Tipagem forte

Reutilização

Baixo acoplamento

Alta coesão

Organização

Escalabilidade

---

# DOCUMENTAÇÃO

Antes de iniciar o desenvolvimento, crie uma documentação completa do projeto.

Ela deverá conter, no mínimo:

## 1. CLAUDE.md

Este será o documento principal do projeto.

Ele deverá funcionar como a memória permanente do Claude.

Sempre que novas decisões arquiteturais forem tomadas, este arquivo deverá ser atualizado.

Ele deverá conter:

- visão geral
- arquitetura
- stack
- padrões
- convenções
- decisões técnicas
- decisões de UX
- regras de negócio
- identidade visual
- estrutura de pastas
- fluxo de desenvolvimento
- backlog
- roadmap
- decisões futuras
- pendências

Este documento deve ser considerado a principal fonte de verdade do projeto.

---

## 2. README.md

Documentação para qualquer desenvolvedor entrar no projeto.

---

## 3. ARCHITECTURE.md

Toda arquitetura.

---

## 4. ROADMAP.md

Planejamento de evolução.

---

## 5. DECISIONS.md

Registro de decisões arquiteturais importantes (ADR).

Sempre que uma decisão importante for tomada, registre o motivo.

---

## 6. UI_GUIDELINES.md

Todo o Design System.

Componentes.

Espaçamentos.

Tipografia.

Cores.

Ícones.

Animações.

Boas práticas.

---

## 7. DATABASE.md

Toda modelagem.

Entidades.

Relacionamentos.

Índices.

Convenções.

---

# DESENVOLVIMENTO

Não tente desenvolver tudo de uma vez.

Divida o projeto em etapas.

Cada etapa deve entregar valor.

Sempre manter o sistema funcionando.

Evitar grandes refatorações desnecessárias.

---

# IMPORTANTE

Você é o arquiteto principal deste projeto.

Não seja apenas um gerador de código.

Questione.

Critique.

Proponha.

Simplifique.

Melhore.

Sempre pense como um CTO experiente.

Sempre procure a melhor solução possível.

O objetivo não é apenas terminar a aplicação.

O objetivo é construir a melhor ferramenta possível para organizar completamente a operação da MedConsultoria e permitir sua evolução contínua com alta qualidade técnica.
