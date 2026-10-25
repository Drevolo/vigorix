# PLANO DE IMPLEMENTAÇÃO - VIGORIX

Este documento foi feito para garantir a continuidade da implementação caso o limite do agente estoure. Caso isso aconteça, o próximo agente deve seguir este passo a passo exatamente na ordem, começando da primeira meta não cumprida.


## 1. Objetivo Final

Criar o **Vigorix**, um site responsivo para controle do plano de treino extraído da planilha `Plano de Treino Semanal e Metas.xlsx`, com foco em uso mobile e desktop. 


## 2. Estado Atual

- [x] Planilha analisada e mapeada (Treino A e Treino B)
- [x] Requisitos definidos pelo usuário (Histórico completo, cronômetro manual, PWA, instalação no celular)
- [x] Nome e paleta definidos (Vigorix + tema escuro)
- [ ] Implementação ainda não iniciada


## 3. Mapeamento de Dados Confirmados

Estes dados devem ser usados obrigatoriamente na criação do `js/data.js`

### Treino A (Segunda, Quarta, Sexta, Domingo) - Queima Calórica e Pernas
| Exercício | Semana 1 | Semana 2 | Semana 3 | Semana 4+ | Foco | Instrução |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Polichinelos | 15 reps | 20 reps | 25 reps | 30 reps | Aquecimento e Cardio | Movimento completo dos braços e pernas. |
| Agachamento Livre | 10 reps | 12 reps | 15 reps | 18 reps | Pernas e Glúteos | Descer até 90 graus, mantendo o tronco reto. |
| Escaladores (Mountain Climbers) | 16 reps (8/perna) | 20 reps (10/perna) | 24 reps (12/perna) | 30 reps (15/perna) | Core e Cardio | Trazer os joelhos em direção ao peito alternadamente em posição de prancha. |
| Flexão de Braço | 8 reps | 10 reps | 12 reps | 15 reps | Peitoral e Tríceps | Corpo reto, descer até o peito quase tocar o chão (pode usar os joelhos se precisar). |
| Toque nos Pés (Touch Toes) | 30 seg | 30 seg | 45 seg | 45 seg | Abdômen | Deitado de costas, pernas para cima, tentar tocar a ponta dos pés. |

### Treino B (Terça, Quinta, Sábado) - Postura, Isometria e Panturrilhas
| Exercício | Semana 1 | Semana 2 | Semana 3 | Semana 4+ | Foco | Instrução |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Anjos na Parede (Wall Angels) | 8 reps | 10 reps | 12 reps | 15 reps | Postura e Ombros | Costas e braços encostados na parede, deslizar os braços para cima e para baixo. |
| Cadeira na Parede (Wall Sit) | 20 seg | 30 seg | 40 seg | 45 seg | Isometria de Pernas | Costas na parede, joelhos a 90 graus, segurar a posição. |
| Elevação de Tibial (Tib Raises) | 12 reps | 15 reps | 18 reps | 20 reps | Canelas (Prevenção) | Calcanhares no chão, costas na parede, levantar as pontas dos pés. |
| Elevação de Panturrilha (Calf Raises) | 15 reps | 20 reps | 25 reps | 30 reps | Panturrilhas | Ficar na ponta dos pés o mais alto possível e descer devagar. |
| Toque nos Pés (Touch Toes) | 30 seg | 30 seg | 45 seg | 45 seg | Abdômen | Deitado de costas, pernas para cima, tentar tocar a ponta dos pés. |

**Regras:** 3 rodadas | 30-40 seg entre exercícios | 1 min entre rodadas


## 4. Passo a Passo com Metas

### FASE 0: PREPARAÇÃO (Meta: Contexto Validado)
**Objetivo:** Garantir que tudo está pronto para iniciar sem perder informações.

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 0.1 | Revisar este plano por completo | Plano lido e compreendido | [x] |
| 0.2 | Confirmar mapeamento de dados acima | Sem divergências com a planilha | [x] |
| 0.3 | Definir diretório de trabalho | Criar em `./vigorix/` na raiz do projeto | [x] |

**Meta da Fase 0:** Plano validado e pronto para criação da estrutura.


### FASE 1: ESTRUTURAÇÃO DE ARQUIVOS (Meta: Estrutura Base Criada)
**Objetivo:** Criar a arquitetura exata para o projeto.

**Arquivos a serem criados:**

```
vigorix/
├── index.html
├── historico.html
├── manifest.json
├── sw.js
├── css/
│   ├── style.css
│   └── animations.css
├── js/
│   ├── data.js
│   ├── utils.js
│   ├── timer.js
│   ├── app.js
│   └── history.js
└── assets/
    └── icons/
```

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 1.1 | Criar diretórios `vigorix/`, `css/`, `js/`, `assets/icons/` | Diretórios existentes | [x] |
| 1.2 | Criar arquivos vazios conforme estrutura acima | Todos os arquivos criados | [x] |
| 1.3 | Validar estrutura com listagem | Estrutura condizente com o planejado | [x] |

**Meta da Fase 1:** Estrutura 100% criada e validada.


### FASE 2: EXTRAÇÃO DOS DADOS (Meta: Fonte Única de Verdade)
**Objetivo:** Centralizar todos os dados no `js/data.js`.

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 2.1 | Criar objeto `TREINO_A` com os 5 exercícios e progressão por semana (Semana 1, 2, 3, 4+) | JSON válido com todos os campos | [ ] |
| 2.2 | Criar objeto `TREINO_B` com os 5 exercícios e progressão por semana | JSON válido com todos os campos | [ ] |
| 2.3 | Criar mapeamento `DIAS_PARA_TREINO` (Seg= A, Ter=B, Qua=A, Qui=B, Sex=A, Sáb=B, Dom=A) | Mapeamento correto conforme planilha | [ ] |
| 2.4 | Adicionar constantes (`RODADAS=3`, `DESCANSO_EXERCICIO="30-40"`, `DESCANSO_RODADA="60"`) | Constantes exportadas/utilizáveis | [ ] |
| 2.5 | Testar sintaxe JS do `data.js` | Sem erros de sintaxe | [ ] |

**Meta da Fase 2:** `data.js` completo, validado e pronto para consumo pelos demais arquivos.


### FASE 3: UTILITÁRIOS E PERSISTÊNCIA (Meta: Base de Lógica)
**Objetivo:** Criar funções reutilizáveis para datas, localStorage e helpers no `js/utils.js`.

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 3.1 | Função para obter data no formato `YYYY-MM-DD` (local) | Retorna data correta independente de timezone | [ ] |
| 3.2 | Função para obter dia da semana em PT-BR | Retorna "Segunda", "Terça", ..., "Domingo" | [ ] |
| 3.3 | Helpers para `localStorage` (get/set com JSON, com tratamento de erro) | Funções seguras e reutilizáveis | [ ] |
| 3.4 | Chaves padronizadas (`vigorix_settings`, `vigorix_current`, `vigorix_history`) | Constantes centralizadas | [ ] |
| 3.5 | Função para gerar ID único (para histórico) | Gera ID utilizável | [ ] |

**Meta da Fase 3:** `utils.js` funcional e pronto para ser utilizado por `app.js` e `history.js`.


### FASE 4: INTERFACE BASE (Meta: UI Estruturada)
**Objetivo:** Criar HTML + CSS base com identidade visual do Vigorix.

**Paleta a ser utilizada:** `#0f1026`, `#1d1e33`, `#7c3fff`, `#22c55e`, `#f59e0b`, `#f8fafc`, `#cbd5e1`, `#2d2e4a`

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 4.1 | Montar `index.html` com header, seletor de semana, progresso geral, container de rodadas e FAB para histórico | Estrutura semântica e mobile-first | [ ] |
| 4.2 | Montar `historico.html` com header, filtros, lista de histórico e modal para detalhes | Estrutura semântica e mobile-first | [ ] |
| 4.3 | Criar `css/style.css` com variáveis CSS, reset, layout responsivo, cards, botões, checklist e progresso | Responsivo (testável em 360px) | [ ] |
| 4.4 | Criar `css/animations.css` com animações sutis | Animações leves e funcionais | [ ] |
| 4.5 | Importar Tailwind CDN, Lucide Icons CDN e arquivos CSS/JS nos HTMLs | Dependências carregando corretamente | [ ] |

**Meta da Fase 4:** Interface estática renderizando corretamente em mobile e desktop.


### FASE 5: LÓGICA DO TREINO (Meta: Core Funcional)
**Objetivo:** Implementar toda a lógica principal no `js/app.js`.

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 5.1 | Detectar dia da semana e exibir Treino A ou B automaticamente | Correto para todos os 7 dias conforme mapeamento | [ ] |
| 5.2 | Gerenciar seletor de semana com persistência em `vigorix_settings` | Troca funcional e salva ao recarregar | [ ] |
| 5.3 | Gerar estrutura de 3 rodadas com exercícios do treino correto para a semana selecionada | Estrutura idêntica ao plano | [ ] |
| 5.4 | Implementar checklist por exercício com persistência no `vigorix_current` | Persistente ao recarregar | [ ] |
| 5.5 | Controlar progresso geral e destaque de rodada completa | Cálculos corretos | [ ] |
| 5.6 | Lógica de "novo dia": criar novo `vigorix_current` sem apagar histórico | Funcional | [ ] |
| 5.7 | Botão "Finalizar treino do dia": só habilitado com 100% completo, mover para `vigorix_history` | Fluxo completo | [ ] |

**Meta da Fase 5:** Usuário consegue realizar o treino do dia completo com persistência funcional.


### FASE 6: CRONÔMETRO MANUAL (Meta: Descanso Funcional)
**Objetivo:** Implementar timer manual no `js/timer.js`.

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 6.1 | Criar modal do cronômetro | Modal abre/fecha corretamente | [ ] |
| 6.2 | Presets: 30 seg, 40 seg, 60 seg + opção custom | Todos funcionais | [ ] |
| 6.3 | Iniciar, Pausar/Continuar, Cancelar | Comportamento correto | [ ] |
| 6.4 | Contagem regressiva MM:SS com aviso visual | Preciso e legível | [ ] |
| 6.5 | Isolado do checklist/progresso | Não interfere | [ ] |

**Meta da Fase 6:** Cronômetro manual 100% funcional.


### FASE 7: HISTÓRICO COMPLETO (Meta: Rastreamento de Evolução)
**Objetivo:** Implementar tela de histórico com dados do dia atual + anteriores no `js/history.js`.

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 7.1 | Salvar treino finalizado com estrutura completa | Estrutura consistente | [ ] |
| 7.2 | Listar histórico ordenado por data (mais recente primeiro) | Ordenação correta | [ ] |
| 7.3 | Filtros "Hoje", "Últimos 7 dias", "Todos" | Filtros corretos | [ ] |
| 7.4 | Modal de detalhes com todas as informações | Completo | [ ] |
| 7.5 | Estatísticas simples (total de treinos e dias distintos) | Cálculos corretos | [ ] |
| 7.6 | Sincronia entre telas | Funcional | [ ] |

**Meta da Fase 7:** Histórico completo funcional.


### FASE 8: PWA (Meta: Instalável e Funcional Offline)
**Objetivo:** Tornar o app instalável como aplicativo.

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 8.1 | Criar `manifest.json` com nome "Vigorix", cores, start_url, display standalone, ícones | Manifest válido | [ ] |
| 8.2 | Criar `sw.js` com cache-first para arquivos estáticos | Service Worker registrado sem erros | [ ] |
| 8.3 | Registrar Service Worker nos HTMLs | Registro funcional | [ ] |
| 8.4 | Adicionar metatags PWA | Metatags presentes | [ ] |
| 8.5 | Testar "Adicionar à tela inicial" | Prompt aparece | [ ] |
| 8.6 | Testar funcionamento offline | Funciona em cache | [ ] |

**Meta da Fase 8:** PWA instalável e com cache básico funcional.


### FASE 9: POLIMENTO E TESTES (Meta: Pronto para Uso)
**Objetivo:** Garantir usabilidade em mobile e PC.

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 9.1 | Teste responsivo 360px até 1920px | Sem quebras | [ ] |
| 9.2 | Teste fluxo completo | Sem erros | [ ] |
| 9.3 | Teste troca de dia | Novo dia criado, histórico preservado | [ ] |
| 9.4 | Teste histórico com detalhes | Dados corretos | [ ] |
| 9.5 | Teste persistência ao recarregar | Estado restaurado | [ ] |
| 9.6 | Revisão geral sem erros no console | Sem erros críticos | [ ] |

**Meta da Fase 9:** App testado e estável.


### FASE 10: FINALIZAÇÃO (Meta: Entregue)
**Objetivo:** Validar entrega final.

| ID | Tarefa | Critério de Conclusão | Status |
| :-- | :-- | :-- | :-- |
| 10.1 | Revisar todos os arquivos criados | 100% presentes | [ ] |
| 10.2 | Validar dados contra planilha | Idênticos | [ ] |
| 10.3 | Validar todos os requisitos do usuário | Todos atendidos | [ ] |
| 10.4 | Resumo final documentado | Completo | [ ] |

**Meta da Fase 10:** Vigorix pronto para uso.


## 5. Instruções para Continuidade

Caso o agente seja interrompido por limite:

1. **Ler este plano primeiro** - Fonte de verdade
2. **Verificar estado** - Listar pasta `vigorix/`
3. **Identificar progresso** - Continuar da primeira meta não cumprida da próxima fase
4. **Não recomeçar** - Apenas dar continuidade
5. **Seguir ordem** - Fases 0 -> 10
6. **Validar antes de avançar** - Cumprir critério de conclusão
7. **Preservar dados** - Nunca alterar chaves `localStorage` de forma a perder histórico
8. **Manter consistência** - Usar dados, paleta e regras deste plano

**STATUS ATUAL:** FASE 1 COMPLETA - Iniciando FASE 2
