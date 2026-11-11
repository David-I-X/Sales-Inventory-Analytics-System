# 📦 Paquete Portable: `codework`

Este directorio contiene la habilidad **`codework`** lista para ser importada en **cualquier proyecto o espacio de trabajo** que utilice asistentes de IA basados en agentes (Antigravity, Claude Code, Cursor, OpenCode, Codex CLI, etc.).

---

## 🚀 ¿Qué es `codework`?
Es un pipeline estandarizado de **ingeniería de software senior (Staff / Principal)** basado en los principios de [Addy Osmani (`agent-skills`)](https://github.com/addyosmani/agent-skills). 

Obliga a los agentes a trabajar con la máxima disciplina técnica a través de 6 fases:
1. **Define & Clarify:** Especificación rigurosa antes de código.
2. **Plan & Constraints:** Desglose en rebanadas verticales atómicas.
3. **Build Incremental & TDD:** Ciclo Red-Green-Refactor paso a paso.
4. **Verify & Quality Gates:** Linter, compilador de tipos y tests obligatorios.
5. **Review in 5 Axes:** Auditoría formal en Correctitud, Legibilidad, Arquitectura, Seguridad y Rendimiento.
6. **Ship & Rollback:** Dictamen formal GO/NO-GO y plan de reversión.

---

## 📂 Cómo instalar esta skill en otro proyecto

Para usar `codework` en un nuevo repositorio o espacio de trabajo, solo debes seguir uno de estos métodos:

### Opción A: A nivel de Proyecto (Recomendado)
Copia la carpeta `codework` dentro de la carpeta de habilidades de tu repositorio:
```text
tu-nuevo-proyecto/
└── .agents/
    └── skills/
        └── codework/
            ├── SKILL.md
            └── README.md
```
*(Si usas Cursor o Claude Code, también puedes colocarlo en `.claude/skills/codework/` o `.cursor/skills/codework/`).*

### Opción B: A nivel Global (Disponible en todos tus proyectos en tu máquina)
Copia la carpeta en la raíz global de habilidades de tu usuario:
* En Windows: `C:\Users\<TU_USUARIO>\.gemini\antigravity\skills\codework\`
* En macOS / Linux: `~/.gemini/antigravity/skills/codework/`

---

## ⚙️ Regla de Activación (Opcional pero Recomendada)

Para asegurarte de que el agente siempre ejecute el pipeline cuando tú lo llames, agrega esta regla en tu archivo `AGENTS.md` o en `.agents/rules/codework.md` de tu nuevo proyecto:

```markdown
# Regla: Trigger "codework"

Cuando el usuario diga "utiliza codework", "codework", "ejecútalo con codework" o pida implementar una funcionalidad con este pipeline:
1. Lee y sigue estrictamente las 6 fases de `.agents/skills/codework/SKILL.md`.
2. Prohibido escribir código de producción sin haber completado la Fase 1 (Criterios de Aceptación) y la Fase 2 (Plan Vertical).
3. Todo cambio debe validarse con el linter y test runner del proyecto antes de emitir el veredicto GO/NO-GO de la Fase 6.
```

---

## 🎯 Cómo activarlo en la conversación
En cualquier momento de tu sesión con el agente en tu nuevo proyecto, simplemente dile:
> *"Implementa el nuevo módulo de autenticación con OAuth, utiliza codework"*  
> o  
> *"Ejecútalo con codework"*
