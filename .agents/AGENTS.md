# Reglas y Especificaciones del Proyecto - FinanCorrientes

Este archivo contiene las especificaciones, reglas de comportamiento y decisiones de diseño del proyecto de Búsqueda Inteligente de Financiamiento para la Provincia de Corrientes. Cualquier agente de codificación o asistente que trabaje en este espacio de trabajo debe seguir estas pautas sin excepción.

---

## 1. Alcance y Foco Temático (Tipos de Financiamiento)

Las búsquedas y el matching de convocatorias deben restringirse a las siguientes áreas temáticas clave:

- **Modernización del Estado:** Digitalización de trámites, plataformas de atención ciudadana, catastros digitales, IoT, modernización de servicios urbanos y analítica pública.
- **Ciencia de Datos:** Procesos analíticos, inteligencia de negocios y ciencia de datos aplicada a la gestión pública o la optimización productiva.
- **Inteligencia Artificial:** Machine Learning, automatización de procesos, IA para la industria y transición tecnológica digital.
- **Huella de Carbono y Sostenibilidad:** Transición ecológica, descarbonización, energías renovables (solar, biomasa), eficiencia energética y economía circular.
- **Forestoindustria:** Industrialización de la madera, tecnificación de aserraderos, biomasa forestal, logística de transporte maderero y valor agregado forestal.
- **Sector Primario:** Optimización agrícola y ganadera, tecnificación de riego, mejoramiento genético, recomposición productiva y buenas prácticas agrícolas.
- **Infraestructura Vial:** Mantenimiento y pavimentación de rutas productivas, conectividad logística rural, consorcios camineros y esquemas de alianzas público-privadas.

---

## 2. Ámbito Geográfico y Destinatarios

- **Ubicación:** Todos los programas y oportunidades identificados deben ser aplicables en la **Provincia de Corrientes, Argentina**.
- **Beneficiarios:** MiPyMEs, PyMEs, startups de base tecnológica, emprendedores locales, productores agropecuarios y organismos gubernamentales locales (ministerios, entes autárquicos y municipios).

---

## 3. Fuentes y Organismos Clave para Búsqueda

Las fuentes prioritarias de financiamiento que el sistema debe monitorear y clasificar son:

### Provinciales (Corrientes)
- Gobierno de la Provincia de Corrientes (Ministerio de Industria, Trabajo y Comercio) → `https://www.corrientes.gob.ar`
- Banco de Corrientes S.A. → `https://www.bancodecorrientes.com.ar`

### Nacionales (Argentina)
- Consejo Federal de Inversiones (CFI) — Líneas de financiamiento verde, triple impacto y asistencia técnica → `https://cfi.org.ar`
- Agencia I+D+i (programas FONTAR, FONSOFT, KIT 4.0) → `https://www.argentina.gob.ar/ciencia/agencia`
- Secretaría de la Pequeña y Mediana Empresa (SEPyME) y ministerios nacionales
- BICE (Banco de Inversión y Comercio Exterior) → `https://www.bice.com.ar`

### Internacionales
- BID Invest / Banco Interamericano de Desarrollo → `https://www.idbinvest.org/es`
- CAF (Banco de Desarrollo de América Latina y el Caribe) → `https://www.caf.com/es`
- Banco Mundial (BIRF) → `https://www.bancomundial.org/es/country/argentina/overview`
- FONPLATA (Banco de Desarrollo de la Cuenca del Plata) → `https://www.fonplata.org/es/proyectos`
- Unión Europea (AL-INVEST Verde, EU-LAC Digital Accelerator, Horizonte Europa) → `https://alinvest-verde.eu`

---

## 4. Arquitectura del Proyecto

### Stack Tecnológico
- **Backend:** FastAPI (Python) con `uvicorn` como servidor ASGI
- **Frontend:** HTML + Vanilla CSS + Vanilla JS (sin frameworks)
- **Datos:** Archivos JSON en `data/convocatorias.json` y `data/noticias.json`
- **Servidor local:** `./venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --reload`

### Estructura de Archivos Clave
```
/
├── main.py                     # Servidor FastAPI, rutas API
├── data/
│   ├── convocatorias.json      # Base de datos de convocatorias de financiamiento
│   └── noticias.json           # Feed de noticias relevantes para Corrientes
├── static/
│   ├── index.html              # Estructura principal del Dashboard (único HTML)
│   ├── app.js                  # Toda la lógica del frontend (estado, renderizado, eventos)
│   └── styles.css              # Estilos globales con diseño glassmorphism dark mode
└── Dockerfile                  # Para deploy en Google Cloud Run
```

### Entornos de Deployment
| Entorno | Detalle |
|---|---|
| **Local** | `http://127.0.0.1:8000` |
| **GitHub** | `github.com/boscojfrancisco/analisis-financiero` (rama `main`) |
| **Google Cloud Run** | `https://financiamiento-corrientes-116988615070.us-central1.run.app` (proyecto `imi-activos-digitales`, región `us-central1`) |

### Comandos de Deploy
```bash
# GitHub
git add -A && git commit -m "mensaje" && git push origin main

# Google Cloud Run
gcloud run deploy financiamiento-corrientes --source . --region us-central1 --allow-unauthenticated --quiet
```

---

## 5. Reglas de Desarrollo Frontend

### Cache-Busting Obligatorio
Cada vez que se modifiquen `styles.css` o `app.js`, se debe incrementar el parámetro de versión en `static/index.html`:
```html
<link rel="stylesheet" href="/static/styles.css?v=YYYYMMDD[letra]">
<script src="/static/app.js?v=YYYYMMDD[letra]"></script>
```
Ejemplo de secuencia: `v=20260706`, `v=20260706b`, `v=20260706c`, etc.

### Layout del Dashboard
- El dashboard usa **una sola columna** (`grid-template-columns: 1fr`) con `max-width: 1200px; margin: 0 auto`.
- **No hay scroll interno** en ningún contenedor de tarjetas. Las tarjetas fluyen naturalmente en la página (scroll de la página, no de un div).
- El panel izquierdo del "Evaluador de Proyectos con IA" fue **eliminado permanentemente**. No debe reintroducirse.

### Diseño Visual
- **Tema:** Dark mode con efecto glassmorphism.
- **Tipografía:** Google Fonts (Inter u Outfit).
- **Colores accent:** Cian (`var(--cyan)`) y violeta/púrpura.
- Cada tarjeta de convocatoria debe mostrar el organismo fuente con un **badge resaltado** (`.card-source-badge`) con ícono 🏛️, fondo degradado cian/violeta y borde sutil.

---

## 6. Estructura de Datos

### convocatorias.json — Campos por ítem
```json
{
  "id": "slug-unico",
  "titulo": "Nombre del programa",
  "organismo": "Nombre del organismo financiador",
  "ambito": "Provincial / Nacional / Internacional",
  "tematica": "Una de las 7 temáticas del punto 1",
  "destinatarios": ["MiPyMEs", "PyMEs", "Gobierno Provincial"],
  "monto_maximo": "Descripción del monto",
  "fecha_cierre": "Fecha o 'Ventanilla permanente'",
  "descripcion": "Descripción del programa",
  "requisitos": ["Requisito 1", "Requisito 2"],
  "como_aplicar": "Pasos numerados para postularse",
  "link_oficial": "URL verificada y funcional (HTTP 200)",
  "fuentes": [
    {
      "tipo": "Directa",
      "categoria": "Bases y Condiciones",
      "nombre": "Nombre descriptivo del enlace",
      "url": "URL verificada y funcional (HTTP 200)"
    }
  ]
}
```

### noticias.json — Campos por ítem
```json
{
  "id": "noticia-N",
  "titulo": "Título de la noticia",
  "fecha": "YYYY-MM-DD",
  "organismo_fuente": "Organismo que genera la noticia",
  "sector": "Una de las 7 temáticas del punto 1",
  "resumen": "Resumen de la noticia",
  "impacto_corrientes": "Análisis de por qué importa a Corrientes",
  "link_oficial": "URL verificada y funcional (HTTP 200)"
}
```

---

## 7. Reglas de Calidad de URLs

**CRÍTICO:** Todas las URLs en `convocatorias.json` y `noticias.json` deben ser **verificadas y funcionales (HTTP 200)** antes de hacer commit. Seguir este proceso:

1. Extraer todas las URLs de ambos archivos JSON.
2. Verificar cada una con un script Python usando `urllib.request` con User-Agent de navegador y timeout de 12 segundos.
3. Clasificar resultados:
   - **200 OK** → Aceptada ✅
   - **404** → URL eliminada, reemplazar por la raíz del organismo ✅
   - **403** → Bloqueada por anti-bot, verificar manualmente en el navegador antes de decidir ⚠️
   - **FAIL/timeout** → Puede funcionar desde Argentina (servidores gubernamentales lentos) ⚠️
4. Nunca usar URLs de subpáginas específicas de convocatorias ya cerradas (ej: `/tercera-convocatoria/`, `/solicitar-aportes-no-reembolsables-anr`). Usar siempre la página institucional raíz del organismo.

---

## 8. Clasificación de Fuentes en el Modal de Detalle

Cuando se muestre el detalle de una convocatoria, las fuentes deben clasificarse en dos categorías visibles:

- **Fuentes Directas** (`"tipo": "Directa"`): Link a la convocatoria, bases y condiciones, o portal de trámite del organismo. Son el punto de entrada para postularse.
- **Fuentes Generales** (`"tipo": "General"`): Portal institucional del organismo, contexto informativo, notas de prensa. Útiles para conocer el organismo pero no son el punto de postulación.

---

## 9. Estilo de Respuesta del Agente

Al finalizar cualquier tarea de desarrollo y deployment, siempre reportar el estado de los 3 entornos en una tabla con este formato:

| Entorno | URL | Estado |
|---|---|---|
| **Google Cloud** ☁️ | URL de Cloud Run | ✅ / ⏳ |
| **GitHub** 🐙 | URL del repositorio | ✅ / ⏳ |
| **Local** 💻 | http://127.0.0.1:8000 | ✅ / ⏳ |
