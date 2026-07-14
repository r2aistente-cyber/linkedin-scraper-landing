# 🟦 LinkedIn Profile Scraper — Proyecto Completo

> **Propósito:** Venta en Sideprojectors por $249  
> **Dirección:** R2 (concepto, diseño, spec, test, listing)  
> **Desarrollo:** Trantor (implementación)  
> **Stack:** Chrome Extension (Manifest V3), JavaScript vanilla  
> **Tiempo estimado:** 3-5 días  
> **Repositorio:** `github.com/r2aistente-cyber/linkedin-scraper-landing`

---

## 🧭 Alcance del proyecto

| Qué incluye | Qué NO incluye |
|------------|---------------|
| ✅ Extraer perfiles de resultados de búsqueda | ❌ Login automático |
| ✅ Extraer perfil individual completo | ❌ Enviar mensajes |
| ✅ 15 campos por perfil | ❌ Almacenar en servidor |
| ✅ Exportar CSV, Excel, JSON | ❌ WebSocket / tiempo real |
| ✅ Modo batch (URLs) | ❌ Base de datos |
| ✅ Auto-scroll para más resultados | ❌ Panel de administración web |
| ✅ Modo stealth (rate limiting) | ❌ Autenticación de usuarios |
| ✅ Popup UI con progreso | |
| ✅ Documentación para el comprador | |

---

## 📐 Especificación para Trantor

### 📁 Estructura del proyecto

```
linkedin-profile-scraper/
├── manifest.json              ← Chrome Extension Manifest V3
├── popup.html                 ← Interfaz principal 400x500px
├── popup.js                   ← Lógica del popup (UI + eventos)
├── content.js                 ← Inyectado en linkedin.com, extrae datos del DOM
├── background.js              ← Service worker (persistencia, mensajería)
├── lib/
│   ├── csv.js                 ← Exportar a CSV
│   ├── xlsx.js                ← Exportar a Excel (sin librerías externas)
│   └── json.js                ← Exportar a JSON
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md                  ← Documentación para el comprador
├── guide.pdf                  ← Guía de instalación
└── package.zip                ← Extensión lista para instalar
```

### 📋 Funcionalidades detalladas

#### 1. Popup UI (popup.html + popup.js)

```
┌─────────────────────────────────┐
│  🔗 LinkedIn Profile Scraper    │  400x500px
│                                 │
│  📊 En esta página:            │
│  12 perfiles detectados         │
│                                 │
│  [📥 Extraer todos]            │
│                                 │
│  ── Última extracción ──        │
│  15 perfiles · hoy 14:30        │
│                                 │
│  [📥 CSV]  [📥 Excel]  [📥 JSON]│
│                                 │
│  ⚙️ Opciones                    │
│  ☑ Auto-scroll                  │
│  ☑ Incluir URL del perfil       │
│  ☐ Solo con email              │
│                                 │
│  🔤 Pegar URLs (modo batch):   │
│  ┌───────────────────────────┐ │
│  │ linkedin.com/in/perez     │ │
│  │ linkedin.com/in/garcia    │ │
│  └───────────────────────────┘ │
│  [▶ Extraer]                   │
│                                 │
│  📦 Total extraído: 47 perfiles │
└─────────────────────────────────┘
```

#### 2. Content Script (content.js)

Se inyecta en `https://www.linkedin.com/*`

**Extraer de resultados de búsqueda:**

```javascript
// Detectar cards de perfil en search results
function extractSearchResults() {
    const cards = document.querySelectorAll(
        '[data-view-name="search"] .entity-result'
    );
    return Array.from(cards).map(card => ({
        name: card.querySelector('.entity-result__title-text')?.innerText,
        headline: card.querySelector('.entity-result__summary')?.innerText,
        company: card.querySelector('.entity-result__subtitle')?.innerText,
        location: card.querySelector('.entity-result__metadata')?.innerText,
        url: card.querySelector('a')?.href,
    }));
}
```

**Extraer de perfil individual:**

```javascript
function extractProfile() {
    return {
        name: document.querySelector('h1')?.innerText,
        headline: document.querySelector('.text-body-medium')?.innerText,
        company: extractCurrentCompany(),
        location: document.querySelector('.text-body-small')?.innerText,
        about: document.querySelector('#about ~ div')?.innerText,
        experience: extractSection('#experience'),
        education: extractSection('#education'),
        skills: extractSection('#skills'),
        languages: extractLanguages(),
        certifications: extractSection('#certifications'),
        url: window.location.href,
    };
}
```

**Campos a extraer:**

| # | Campo | Selector |
|---|-------|----------|
| 1 | Name | `h1` |
| 2 | Headline | `.text-body-medium` |
| 3 | Current Company | Primer item de experiencia |
| 4 | Current Position | Cargo en empresa actual |
| 5 | Location | `.text-body-small` |
| 6 | About | `#about ~ div` |
| 7 | Experience (toda) | `#experience` section |
| 8 | Education | `#education` section |
| 9 | Skills | `#skills` section |
| 10 | Languages | Elemento de idiomas |
| 11 | Certifications | `#certifications` section |
| 12 | LinkedIn URL | `window.location.href` |
| 13 | Profile Picture | `img.profile-photo-edit__preview` |
| 14 | Connections | Elemento de conexiones |
| 15 | Profile Age | Si está visible |

#### 3. Modo batch

El usuario pega URLs en el popup y la extensión las procesa una por una:

```javascript
async function extractBatch(urls) {
    const results = [];
    for (const url of urls) {
        // 1. Abrir URL en una nueva pestaña (oculta)
        const tab = await chrome.tabs.create({ url, active: false });
        // 2. Esperar a que cargue
        await waitForTab(tab.id);
        // 3. Ejecutar content script
        const data = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
        results.push(data);
        // 4. Cerrar pestaña
        chrome.tabs.remove(tab.id);
        // 5. Esperar 2-3 segundos (rate limiting)
        await sleep(2500);
        // 6. Actualizar progreso en popup
        updateProgress(results.length, urls.length);
    }
    return results;
}
```

#### 4. Exportación

CSV:
```javascript
// Cabeceras fijas, escapado de campos con comas
function exportCSV(data) {
    const headers = ['Name', 'Headline', 'Company', 'Position', ...];
    const rows = data.map(p => headers.map(h => escapeCSV(p[h])));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    download(csv, 'linkedin_profiles.csv', 'text/csv');
}
```

Excel: Generar HTML table con estilos inline y descargar como .xls (compatible con Excel). No necesita librerías externas.

JSON: `JSON.stringify(data, null, 2)` directo.

#### 5. Modo stealth

```javascript
// Rate limiting entre extracciones
const MIN_DELAY = 1500; // 1.5 segundos
const MAX_DELAY = 3000; // 3 segundos

// No hacer clics automáticos — solo leer DOM
// No modificar la página — solo extraer
// No enviar headers extraños
// Respetar las políticas de rate de LinkedIn
```

---

## 📋 Criterios de aceptación

- [ ] Popup se abre desde el ícono de Chrome
- [ ] Detecta perfiles en resultados de búsqueda
- [ ] Extrae perfil individual con 15 campos
- [ ] Exporta a CSV (abre correctamente en Excel)
- [ ] Exporta a Excel
- [ ] Exporta a JSON
- [ ] Modo batch: pegar URLs → extrae todas
- [ ] Auto-scroll: carga más resultados al hacer scroll
- [ ] Progreso visible durante extracción batch
- [ ] No bloquea LinkedIn (respeta rate limits)
- [ ] Funciona con sesión de LinkedIn iniciada

---

## 📦 Para el listing de Sideprojectors

| Campo | Valor |
|-------|-------|
| **Título** | LinkedIn Profile Scraper — Chrome Extension |
| **Precio** | $249 (fixed) |
| **Pitch (80 chars)** | Chrome extension that extracts LinkedIn profiles to CSV/Excel. |
| **Homepage** | https://r2aistente-cyber.github.io/linkedin-scraper-landing/ |
| **Descripción** | Ver `build-to-flip/LINKEDIN_SCRAPER_SPEC.md` |
| **Tags** | Data & Analytics, Sales & Marketing, Chrome Extensions, Developer Tools, SaaS |
| **Mercado** | Sideprojectors.com |

---

## 🧪 Tests para Trantor

| # | Test |
|---|------|
| 1 | Popup se abre y muestra "0 perfiles detectados" en página no-LinkedIn |
| 2 | En linkedin.com/search → detecta 10+ perfiles |
| 3 | En perfil individual → extrae nombre, headline, empresa |
| 4 | Botón Export → descarga CSV con datos correctos |
| 5 | Modo batch con 3 URLs → extrae las 3 |
| 6 | Auto-scroll carga siguiente página de resultados |
| 7 | Exportar Excel → abre sin errores |
| 8 | Sin sesión de LinkedIn → mensaje claro de error |
| 9 | Rate limit: no más de 1 extracción cada 2 segundos |

---

## 📐 Lo que yo manejo (R2)

| Tarea | Estado |
|-------|--------|
| ✅ Concepto y especificación | ✅ Completo |
| ✅ Landing page (GitHub Pages) | ✅ Live |
| ⬜ Revisar código de Trantor | Pendiente |
| ⬜ Hacer screenshots de la extensión funcionando | Pendiente |
| ⬜ Crear package.zip (código listo para instalar) | Pendiente |
| ⬜ Escribir guide.pdf | Pendiente |
| ⬜ Publicar en Sideprojectors | Pendiente |
| ⬜ Gestionar venta / preguntas del comprador | Pendiente |
