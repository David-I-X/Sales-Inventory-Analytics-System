# 📦 Paquete Portable: `brandingwork`

Este directorio contiene la habilidad **`brandingwork`** lista para ser importada en **cualquier proyecto o espacio de trabajo** que requiera diseño de interfaces, branding y control de calidad visual con IA.

---

## 🎨 ¿Qué es `brandingwork`?
Es un pipeline de diseño y branding de producto que combina dos estándares modernos:
1. **FigCraft-First:** Prohíbe escribir código frontend a ciegas; primero se maquetan y aprueban los boards en FigCraft (resoluciones desktop 1440px y móvil 390px).
2. **Elephanfish (Elephant-Goldfish Model / EGM de Google):** Elimina el sesgo del agente constructor invocando a un subagente efímero (*Goldfish*) con cero memoria del chat para que audite de forma fría y adversarial las capturas reales de pantalla contra las reglas de diseño.

---

## 📂 Cómo instalar esta skill en otro proyecto

### Opción A: A nivel de Proyecto (Recomendado)
Copia la carpeta `brandingwork` dentro de la carpeta de habilidades de tu nuevo proyecto:
```text
tu-nuevo-proyecto/
└── .agents/
    └── skills/
        └── brandingwork/
            ├── SKILL.md
            ├── README.md
            └── templates/
                ├── DESIGN.template.md
                ├── brand-tokens.template.json
                └── EGM_DRIFT_REPORT.template.md
```

### Opción B: A nivel Global (Disponible en todos tus proyectos)
Copia la carpeta en la raíz global de habilidades de tu usuario:
* En Windows: `C:\Users\<TU_USUARIO>\.gemini\antigravity\skills\brandingwork\`
* En macOS / Linux: `~/.gemini/antigravity/skills/brandingwork/`

---

## ⚙️ Configuración Inicial en tu Nuevo Proyecto

Para que `brandingwork` funcione con su máximo potencial en cualquier proyecto:

1. **Crea tu archivo `DESIGN.md`:**  
   Copia `templates/DESIGN.template.md` a la raíz de tu proyecto como `DESIGN.md` y personaliza tus colores, tipografías y reglas de marca.
2. **Coloca tu logo oficial:**  
   Coloca tu archivo de logotipo en `brand-workspace/assets-in/` o en `public/logo.png`.
3. **Agrega la Regla de Activación:**  
   Agrega esto en el archivo `AGENTS.md` o `.agents/rules/brandingwork.md` de tu nuevo proyecto:

```markdown
# Regla: Trigger "brandingwork"

Cuando el usuario diga "ejecútalo con brandingwork", "brandingwork" o pida iterar el diseño visual/UI con este pipeline:
1. Sigue estrictamente las 6 fases de `.agents/skills/brandingwork/SKILL.md`.
2. Diseña y audita PRIMERO en FigCraft antes de escribir código frontend.
3. Ejecuta la auditoría adversarial Elephanfish (Goldfish) en la Fase 5 y no des por terminada la tarea sin un reporte PASS.
```

---

## 🎯 Cómo activarlo en la conversación
En cualquier momento de tu sesión con el agente en tu nuevo proyecto, simplemente dile:
> *"Diseña la nueva pantalla de registro y bienvenida para la app móvil, ejecútalo con brandingwork"*  
> o  
> *"Aplica brandingwork a la landing page"*
