# Notas: Agentes IA y herramientas de Claude

Conversación del 2026-06-09

---

## Dreaming

Herramienta de Claude (Managed Agents API) que revisa los transcripts pasados de tus agentes para organizar la memoria existente y generar nuevos insights en un memory store.

- **Parámetros:** Memory store (destino) + Model (modelo a usar)
- **Analogía:** consolidación de memoria durante el sueño
- **Disponible en:** claude.ai web / API — no instalable localmente

---

## Outcomes

Primitiva del Managed Agents API para definir qué significa "terminado" para un agente.

```js
{
  type: "user.define_outcome",
  description: "Build a DCF model for Costco",
  rubric: { type: "file", file: "file_01..." },
  max_iterations: 5
}
// → ✓ satisfied after 4 iterations
```

- Le das una rúbrica de éxito y el agente itera solo hasta cumplirla
- Si no lo logra en `max_iterations`, se detiene

---

## Qué es un agente

Programa de IA que toma decisiones y ejecuta acciones de forma autónoma para completar una tarea, sin que el usuario guíe cada paso.

| Chat normal | Agente |
|---|---|
| Tú preguntas, él responde | Tú das un objetivo, él actúa |
| Solo genera texto | Puede usar herramientas |
| Una sola respuesta | Múltiples pasos encadenados |

---

## Agente vs Subagente

```
Agente principal (Orchestrator)
├── Subagente A → subtarea específica
├── Subagente B → subtarea específica
└── Subagente C → subtarea específica
```

| | Agente principal | Subagente |
|---|---|---|
| Rol | Planifica y coordina | Ejecuta una subtarea |
| Scope | Ve el objetivo completo | Ve solo su parte |
| Quién lo crea | El desarrollador | El agente principal |

Los subagentes corren en paralelo y se especializan — el agente principal consolida.

---

## Artefacto

El **entregable** que produce un agente. No es un actor, es un producto (archivo, documento, código, imagen).

- Agente = el arquitecto
- Subagente = cada especialista
- Artefacto = los planos que producen

---

## API

Contrato de comunicación entre dos programas. Define cómo pedirle algo a otro sistema y qué devuelve.

**Analogía:** el mesero de un restaurante — no entras a la cocina, usas al mesero.

---

## MCP (Model Context Protocol)

Estándar abierto de Anthropic para conectar modelos de IA con herramientas y fuentes de datos externas.

```
Claude
  ├── MCP Server: Slack
  ├── MCP Server: GitHub
  ├── MCP Server: Spotify
  └── MCP Server: Gmail
```

- Sin MCP: cada integración era código custom diferente
- Con MCP: un solo protocolo universal para todas las herramientas

---

## ¿Se necesita servidor para crear un agente?

| Escenario | ¿Servidor? |
|---|---|
| Prueba local / script puntual | No |
| Agente disponible 24/7 | Sí |
| Agente con memoria persistente | Sí |
| Managed Agents API de Anthropic | No (Anthropic lo gestiona) |

---

## Agentes destacados por dominio

| Dominio | Agente |
|---|---|
| Código | Devin, Claude Code, Cursor |
| Investigación | Deep Research (OpenAI), Perplexity |
| Uso del computador | Operator (OpenAI), Computer Use (Claude) |

---

## Caso de uso: Agente para campañas de marketing digital (firmas de abogados)

### Arquitectura

```
Orquestador: Campaign Manager
├── Subagente 1: Research      → firma, competencia, keywords
├── Subagente 2: Strategy      → audiencia, canales, presupuesto
├── Subagente 3: Copywriter    → textos de anuncios
├── Subagente 4: Campaign Setup → crea campañas en Google/Meta
└── Subagente 5: Analytics     → monitorea y optimiza
```

### Herramientas necesarias

- Google Ads API
- Meta Ads API
- Google Search API
- Google Analytics API
- Claude API (estrategia y contenido)

### Fases de construcción

**Fase 1 — MVP:** Claude + web search → estrategia + copy para usar manualmente

**Fase 2 — Semi-automático:** conectar Google Ads API para crear campañas directamente

**Fase 3 — Autónomo:** monitoreo, iteración y optimización automática
