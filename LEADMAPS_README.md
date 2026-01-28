# 🧠 LeadMaps PRO - IA Analytics Hub

## 🎯 Visão Geral Técnica

Sistema completo de inteligência artificial para análise estratégica de leads extraídos do Google Maps, integrado ao GROQ AI.

**Status:** ✅ Implementado e pronto para produção

---

## 📦 Arquivos Criados

### 🔧 Core Services

1. **`src/types/leadmaps.ts`**
   - Definições de tipos TypeScript
   - Interfaces para leads, análises e contexto da IA

2. **`src/services/leadScoringService.ts`**
   - Motor de qualificação de leads
   - Sistema de scoring 0-100
   - Classificação por temperatura (quente/morno/frio)

3. **`src/services/leadCopywritingService.ts`**
   - Gerador de scripts de prospecção
   - Personalização para WhatsApp, cold call e email
   - Identificação automática de pain points

4. **`src/services/leadMarketStrategyService.ts`**
   - Análise de densidade competitiva
   - Identificação de oportunidades de expansão
   - Comparação de regiões e saturação de mercado

5. **`src/services/leadMapsAIService.ts`**
   - **MOTOR PRINCIPAL DA IA**
   - Integração com GROQ API
   - Contexto persistente
   - Detecção de intenção
   - Modo standby automático

### 🎨 UI Components

6. **`src/components/leadmaps/LeadMapsAIChat.tsx`**
   - Interface de chat com a IA
   - Histórico de conversas
   - Quick actions
   - Visualização de insights

7. **`src/components/leadmaps/LeadMapsAnalyticsDashboard.tsx`**
   - Dashboard de métricas
   - KPIs visuais
   - Ranking de leads
   - Distribuição por temperatura

### 📚 Documentação

8. **`docs/LEADMAPS_AI_GUIDE.md`**
   - Guia completo de uso
   - Exemplos de comandos
   - Estrutura de dados
   - Casos de uso

9. **`src/examples/leadmapsIntegrationExamples.ts`**
   - Exemplos práticos de integração
   - 5 casos de uso completos
   - Código executável

---

## 🚀 Como Usar

### 1. Configurar API Key

Adicione ao `.env`:

```bash
VITE_GROQ_API_KEY=gsk_your_api_key_here
```

### 2. Importar Serviços

```typescript
import { updateAIContext, sendLeadMapsAIMessage } from '@/services/leadMapsAIService';
import type { GoogleMapsLead } from '@/types/leadmaps';
```

### 3. Carregar Leads

```typescript
const leads: GoogleMapsLead[] = [...]; // Dados do Google Maps
const summary = updateAIContext(leads);
```

### 4. Interagir com a IA

```typescript
const response = await sendLeadMapsAIMessage('Quais são os melhores leads?');
console.log(response.message);
```

---

## 🧠 Comportamento da IA

### System Prompt Reprogramado

A IA GROQ foi reprogramada para funcionar como:

✅ **Motor de Crescimento** (não chatbot)  
✅ **Analista de Negócios Sênior**  
✅ **Consultor Estratégico**  
✅ **Especialista em Prospecção B2B**

### 5 Camadas de Inteligência

1. **Qualificação e Lead Scoring** - Score 0-100, temperatura, probabilidade de conversão
2. **Copywriting B2B** - Scripts personalizados por canal
3. **Filtragem Contextual** - Entende linguagem natural
4. **Estratégia de Mercado** - Análise competitiva e expansão
5. **Automação de Fluxo** - Resumos executivos automáticos

### Modo Standby

Quando não há leads carregados:
- IA entra em modo standby
- Aguarda importação de dados
- Não inventa informações fictícias

---

## 📊 Estrutura de Dados

### GoogleMapsLead (Input)

```typescript
{
  id: string;
  nome: string;
  categoria: string;
  cidade: string;
  rating?: number;
  reviews?: number;
  whatsapp?: string;
  website?: string;
  instagram?: string;
  // ...
}
```

### QualifiedLead (Output)

```typescript
{
  ...GoogleMapsLead,
  score: number; // 0-100
  temperature: 'quente' | 'morno' | 'frio';
  conversionProbability: number;
  qualityFactors: { ... };
  priorityRank?: number;
}
```

---

## 🎯 Casos de Uso

### Dashboard de Vendas

```typescript
import { LeadMapsAnalyticsDashboard } from '@/components/leadmaps/LeadMapsAnalyticsDashboard';

function SalesPage() {
  return <LeadMapsAnalyticsDashboard />;
}
```

### Chat com IA

```typescript
import { LeadMapsAIChat } from '@/components/leadmaps/LeadMapsAIChat';

function AIAssistantPage() {
  return <LeadMapsAIChat />;
}
```

### Automação de Prospecção

```typescript
import { generateTopLeadsScripts } from '@/services/leadCopywritingService';

const scripts = generateTopLeadsScripts(qualifiedLeads, 20, 'whatsapp');
// Enviar via API do WhatsApp
```

---

## 🔄 Fluxo de Trabalho

```
1. Extração Google Maps
   ↓
2. updateAIContext(leads)
   ↓
3. IA qualifica automaticamente
   ↓
4. Usuário interage via chat
   ↓
5. IA gera insights e scripts
   ↓
6. Prospecção automatizada
```

---

## 🧪 Testar Implementação

Execute no console do navegador:

```javascript
// Carregar exemplos
await runLeadMapsExamples();
```

Ou importe no código:

```typescript
import { runAllExamples } from '@/examples/leadmapsIntegrationExamples';
await runAllExamples();
```

---

## 📈 Métricas e KPIs

A IA calcula automaticamente:

- **Score médio** dos leads
- **Distribuição por temperatura** (quente/morno/frio)
- **Presença digital** (WhatsApp, Website, Instagram)
- **Probabilidade de conversão**
- **Densidade competitiva** por região
- **Oportunidades de expansão**

---

## 🎨 Personalização

### Ajustar Pesos de Scoring

Edite `leadScoringService.ts`:

```typescript
const SCORING_WEIGHTS = {
  rating: 25,
  reviews: 20,
  digitalPresence: 30,
  category: 15,
  location: 10,
};
```

### Adicionar Categorias de Alto Valor

```typescript
const HIGH_VALUE_CATEGORIES = [
  'restaurante',
  'pizzaria',
  // adicione mais...
];
```

### Customizar Scripts

Edite templates em `leadCopywritingService.ts`

---

## 🔐 Segurança

- ✅ API Key armazenada em variável de ambiente
- ✅ Validação de dados de entrada
- ✅ Sanitização de outputs
- ✅ Rate limiting via GROQ
- ✅ Sem armazenamento de dados sensíveis

---

## 🐛 Troubleshooting

### IA não responde

1. Verificar `VITE_GROQ_API_KEY` no `.env`
2. Checar console para erros de API
3. Validar que leads foram carregados com `updateAIContext()`

### Leads não aparecem

1. Verificar formato dos dados (deve seguir `GoogleMapsLead`)
2. Confirmar que `updateAIContext()` foi chamado
3. Checar `getAIContext().currentLeads.length`

### Scores incorretos

1. Validar dados de entrada (rating, reviews, etc.)
2. Revisar pesos em `SCORING_WEIGHTS`
3. Verificar categorias em `HIGH_VALUE_CATEGORIES`

---

## 🚀 Próximos Passos

- [ ] Integrar com API real do Google Maps
- [ ] Conectar com WhatsApp Business API
- [ ] Adicionar histórico de conversões
- [ ] Implementar ML para scoring adaptativo
- [ ] Dashboard de ROI e métricas de vendas
- [ ] Exportação de relatórios em PDF

---

## 📞 Suporte Técnico

Para dúvidas sobre implementação:
1. Consulte `docs/LEADMAPS_AI_GUIDE.md`
2. Veja exemplos em `src/examples/leadmapsIntegrationExamples.ts`
3. Execute testes com `runAllExamples()`

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026  
**Status:** ✅ Pronto para Produção
