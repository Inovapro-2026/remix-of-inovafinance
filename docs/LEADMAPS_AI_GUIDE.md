# 🧠 LeadMaps PRO - IA Analytics Hub

## 📋 Visão Geral

O **IA Analytics Hub** é um motor de crescimento baseado em IA que transforma dados brutos do Google Maps em decisões estratégicas, priorização comercial e geração de lucro.

**Não é um chatbot. É um Growth Engine.**

---

## 🎯 Funcionalidades

### 1️⃣ Qualificação e Lead Scoring Inteligente

Analisa automaticamente cada lead e atribui:
- **Score de 0-100** baseado em múltiplos critérios
- **Temperatura**: 🔥 Quente | ⚠️ Morno | ❄️ Frio
- **Probabilidade de conversão** (0-100%)

**Critérios de scoring:**
- Rating no Google (0-25 pontos)
- Volume de reviews (0-20 pontos)
- Presença digital (0-30 pontos)
- Categoria do negócio (0-15 pontos)
- Localização (0-10 pontos)

### 2️⃣ Engenharia de Prospecção (Copywriting B2B)

Gera scripts personalizados para:
- 💬 WhatsApp
- 📞 Cold Call
- 📧 Email

**Personalização baseada em:**
- Nome real da empresa
- Avaliação no Google
- Falhas digitais detectadas
- Pain points específicos

### 3️⃣ Filtragem Contextual Avançada

Entende comandos em linguagem natural:
- "Separe apenas pizzarias com WhatsApp"
- "Quais negócios não possuem Instagram?"
- "Liste leads de São Paulo com nota acima de 4.5"
- "Crie uma lista dos 10 melhores leads"

### 4️⃣ Estrategista de Expansão e Mercado

Funções estratégicas:
- Identifica nichos saturados
- Compara densidade competitiva
- Avalia excesso ou falta de concorrentes
- Sugere bairros e cidades com oportunidade

### 5️⃣ Automação de Fluxo de Trabalho

Sempre que uma nova extração ocorrer:
- Atualiza automaticamente o contexto
- Gera resumo executivo
- Compara com extrações anteriores
- Aponta evolução ou queda de qualidade

---

## 🚀 Como Usar

### Importar Serviços

```typescript
import { 
  updateAIContext, 
  sendLeadMapsAIMessage,
  getAIContext,
  clearAIContext 
} from '@/services/leadMapsAIService';

import { qualifyLeads } from '@/services/leadScoringService';
import { generateProspectingScript } from '@/services/leadCopywritingService';
import { analyzeMarketByRegion } from '@/services/leadMarketStrategyService';
```

### 1. Atualizar Contexto com Novos Leads

```typescript
const leads: GoogleMapsLead[] = [
  {
    id: '1',
    nome: 'Pizzaria Bella Napoli',
    categoria: 'Pizzaria',
    endereco: 'Rua das Flores, 123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    telefone: '11999999999',
    whatsapp: '11999999999',
    rating: 4.8,
    reviews: 320,
    palavraChave: 'pizzaria',
    extractedAt: new Date().toISOString(),
  },
  // ... mais leads
];

// Atualiza contexto e recebe resumo executivo
const summary = updateAIContext(leads);

console.log(summary);
// {
//   extractionId: 'ext_1234567890',
//   totalLeads: 84,
//   qualifiedLeads: { quentes: 18, mornos: 42, frios: 24 },
//   topOpportunities: [...],
//   marketInsights: [...],
//   nextActions: [...]
// }
```

### 2. Conversar com a IA

```typescript
const response = await sendLeadMapsAIMessage(
  'Quais são os 10 melhores leads para prospectar agora?'
);

console.log(response.message);
// "Analisando seus 84 leads atuais, identifiquei 18 oportunidades quentes..."

console.log(response.data?.leads);
// Array com os leads qualificados
```

### 3. Gerar Scripts de Prospecção

```typescript
import { generateProspectingScript } from '@/services/leadCopywritingService';

const lead = qualifiedLeads[0]; // Lead com maior score

const whatsappScript = generateProspectingScript(lead, 'whatsapp');
console.log(whatsappScript.script);
// "Olá! Tudo bem?
// Vi que Pizzaria Bella Napoli possui avaliação 4.8 ⭐ no Google..."

const callScript = generateProspectingScript(lead, 'call');
const emailScript = generateProspectingScript(lead, 'email');
```

### 4. Análise de Mercado

```typescript
import { analyzeMarketByRegion } from '@/services/leadMarketStrategyService';

const analysis = analyzeMarketByRegion(leads, 'São Paulo');

console.log(analysis);
// {
//   region: 'São Paulo',
//   totalLeads: 48,
//   competitionDensity: 'alta',
//   averageRating: 4.2,
//   topCategories: [...],
//   opportunities: [
//     '65% dos negócios sem site — grande oportunidade de digitalização'
//   ],
//   warnings: [
//     '⚠️ Alta saturação — entrada de novos players será desafiadora'
//   ],
//   recommendations: [...]
// }
```

### 5. Filtrar Leads

```typescript
import { filterByTemperature } from '@/services/leadScoringService';

// Apenas leads quentes
const hotLeads = filterByTemperature(qualifiedLeads, ['quente']);

// Leads quentes e mornos
const warmAndHot = filterByTemperature(qualifiedLeads, ['quente', 'morno']);
```

---

## 💬 Exemplos de Comandos

### Qualificação
- "Quantos leads quentes temos?"
- "Qual o score médio dos leads?"
- "Mostre os 5 melhores leads"

### Copywriting
- "Gere um script de WhatsApp para a Pizzaria Bella Napoli"
- "Crie mensagens para os 10 melhores leads"
- "Qual a melhor abordagem para leads sem website?"

### Filtragem
- "Separe apenas pizzarias com WhatsApp"
- "Quais negócios não possuem Instagram?"
- "Liste leads de São Paulo com nota acima de 4.5"
- "Mostre apenas leads quentes"

### Estratégia
- "Qual região tem mais oportunidade?"
- "Analise a saturação de mercado em São Paulo"
- "Quais bairros devo evitar?"
- "Compare Centro vs Zona Sul"

### Resumo
- "Faça um resumo da última extração"
- "Como estamos comparado à extração anterior?"
- "Qual a evolução de qualidade dos leads?"

---

## 🎨 Comportamento da IA

### ✅ A IA SEMPRE:
- Trabalha com dados reais
- Responde como analista de negócios
- Usa linguagem profissional e estratégica
- Foca em lucro, conversão e ROI
- Cita números e dados concretos

### ❌ A IA NUNCA:
- Inventa leads fictícios
- Usa dados mock
- Responde como chatbot casual
- Faz suposições sem base nos dados

---

## 🟡 Modo Standby

Quando não há leads carregados, a IA entra em **Modo Standby**:

```
🟡 MODO STANDBY

Aguardando extração de leads para iniciar análises estratégicas.

Assim que você importar dados do Google Maps, poderei:
✅ Qualificar e pontuar leads
✅ Gerar scripts de prospecção
✅ Analisar densidade de mercado
✅ Identificar oportunidades de expansão
✅ Priorizar ações comerciais
```

---

## 🔧 Configuração

### Variável de Ambiente

Adicione ao `.env`:

```bash
VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Verificar Configuração

```typescript
import { isLeadMapsAIConfigured } from '@/services/leadMapsAIService';

if (!isLeadMapsAIConfigured()) {
  console.error('GROQ API Key não configurada!');
}
```

---

## 📊 Estrutura de Dados

### GoogleMapsLead

```typescript
interface GoogleMapsLead {
  id: string;
  nome: string;
  categoria: string;
  endereco: string;
  bairro?: string;
  cidade: string;
  estado: string;
  telefone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  palavraChave: string;
  extractedAt: string;
}
```

### QualifiedLead

```typescript
interface QualifiedLead extends GoogleMapsLead {
  score: number; // 0-100
  temperature: 'quente' | 'morno' | 'frio';
  qualityFactors: {
    hasDigitalPresence: boolean;
    hasHighRating: boolean;
    hasGoodReviewVolume: boolean;
    hasWhatsApp: boolean;
    hasWebsite: boolean;
    hasInstagram: boolean;
  };
  conversionProbability: number; // 0-100
  priorityRank?: number;
}
```

---

## 🎯 Casos de Uso

### 1. Dashboard de Vendas

```typescript
const context = getAIContext();
const stats = getQualificationStats(context.qualifiedLeads);

// Exibir métricas
console.log(`Total: ${stats.total}`);
console.log(`Quentes: ${stats.distribution.quentes}`);
console.log(`Score médio: ${stats.averages.score}`);
```

### 2. Automação de Prospecção

```typescript
// Pegar top 20 leads quentes
const hotLeads = filterByTemperature(qualifiedLeads, ['quente']).slice(0, 20);

// Gerar scripts para todos
const scripts = hotLeads.map(lead => 
  generateProspectingScript(lead, 'whatsapp')
);

// Enviar automaticamente via API do WhatsApp
scripts.forEach(script => {
  sendWhatsAppMessage(script.leadId, script.script);
});
```

### 3. Relatório Executivo

```typescript
const summary = aiContext.lastExtraction;

const report = `
📊 RELATÓRIO DE EXTRAÇÃO

Data: ${new Date(summary.timestamp).toLocaleDateString()}
Total de Leads: ${summary.totalLeads}

🔥 Leads Quentes: ${summary.qualifiedLeads.quentes}
⚠️ Leads Mornos: ${summary.qualifiedLeads.mornos}
❄️ Leads Frios: ${summary.qualifiedLeads.frios}

📈 Insights:
${summary.marketInsights.map(i => `- ${i}`).join('\n')}

✅ Próximas Ações:
${summary.nextActions.map(a => `- ${a}`).join('\n')}
`;

console.log(report);
```

---

## 🚀 Próximos Passos

1. **Integrar com extração do Google Maps**
2. **Criar interface de chat** para interagir com a IA
3. **Implementar dashboard** com métricas em tempo real
4. **Automatizar envio** de scripts via WhatsApp/Email
5. **Adicionar histórico** de conversões para ML

---

## 📞 Suporte

Para dúvidas ou sugestões sobre o IA Analytics Hub, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento.

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2026
