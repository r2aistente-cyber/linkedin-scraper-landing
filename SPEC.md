# LinkedIn Profile Scraper — Chrome Extension

> **Propósito:** Venta en Flippa / Sideprojectors
> **Precio objetivo:** $249 - $499 USD
> **Stack:** Chrome Extension (Manifest V3), JavaScript vanilla
> **Tiempo estimado:** 3-5 días

---

## 📋 Descripción del producto

Chrome extension liviana que extrae datos de perfiles de LinkedIn y los exporta a CSV/Excel. No requiere API keys externas, no requiere servidor, todo corre en el navegador del usuario.

---

## ✅ Funcionalidades

### 1. Extraer de resultados de búsqueda

Cuando el usuario hace una búsqueda en LinkedIn (ej: "software engineers Medellin"):

```
Resultados de búsqueda                      Extracción
─────────────────────────                   ─────────────────
                                              Nombre
  👤 Juan Pérez                              Headline
    Software Engineer en Mercado Libre        Empresa actual
    Medellín, Antioquia                      Ubicación
                                              LinkedIn URL
    ─────────────────────                    
    👤 María García
    Data Scientist en Rappi                  Un clic → exporta TODO
    Bogotá, Colombia                         en un CSV
```

- Detecta automáticamente los resultados de la página actual
- Botón "Extract all from this page"
- Scroll automático para cargar más resultados (paginación)

### 2. Extraer de perfil individual

Cuando el usuario está viendo un perfil específico:

```
Perfil individual                           Extracción
─────────────────────────                   ─────────────────
  👤 Juan Pérez                              Nombre
  Software Engineer                          Headline
  Mercado Libre · 5 años                     Empresa actual
  Medellín, Antioquia                        Experiencia
  ─────────────────                          Educación
  Experiencia                                Habilidades
    Senior Dev en ML · 2022-2026             LinkedIn URL
    Junior Dev en startup · 2020-2022        Idiomas
  ─────────────────                          Certificaciones
  Educación
  Universidad EAFIT · 2015-2020
```

- Botón "Extract this profile"
- Extrae hasta 15 campos por perfil

### 3. Campos extraídos

| # | Campo | De dónde lo saca |
|---|-------|-----------------|
| 1 | Full Name | Header del perfil |
| 2 | Headline | Línea debajo del nombre |
| 3 | Current Company | Sección de experiencia, primer item |
| 4 | Current Position | Cargo actual |
| 5 | Location | Ubicación en el header |
| 6 | About | Sección "Acerca de" |
| 7 | Experience (all) | Lista completa de experiencias |
| 8 | Education | Lista de educación |
| 9 | Skills | Lista de habilidades |
| 10 | Languages | Idiomas (si tiene) |
| 11 | Certifications | Certificaciones (si tiene) |
| 12 | LinkedIn URL | URL del perfil |
| 13 | Profile Picture URL | URL de la foto |
| 14 | Connections Count | Número de conexiones |
| 15 | Profile Age | Tiempo en LinkedIn (si visible) |

### 4. Exportación

```
Botón [📥 Exportar]
         │
         ├── CSV (compatible con Excel, Google Sheets)
         │     → linkedin_profiles_2026-07-14.csv
         │
         ├── Excel (.xlsx) sin dependencias externas
         │     → linkedin_profiles_2026-07-14.xlsx
         │
         └── JSON (para desarrolladores)
               → linkedin_profiles_2026-07-14.json
```

- Los archivos se descargan automáticamente al navegador
- Nombre de archivo con fecha para no sobrescribir

### 5. Interfaz

```
┌─────────────────────────────────┐
│  🔗 LinkedIn Profile Scraper    │
│                                 │
│  📊 En esta página:             │
│  10 perfiles detectados         │
│                                 │
│  [📥 Extraer todo]              │
│                                 │
│  ── Última extracción ──        │
│  15 perfiles extraídos          │
│  hoy 14:30                      │
│                                 │
│  [📥 Exportar CSV]              │
│  [📥 Exportar Excel]            │
│  [📥 Exportar JSON]             │
│                                 │
│  ⚙️ Opciones                    │
│  ☑ Incluir URL del perfil       │
│  ☐ Solo con email              │
│  ☐ Auto-scroll para más        │
│  resultados                     │
│                                 │
│  Total extraído hoy: 47 perfiles│
└─────────────────────────────────┘
```

### 6. Modo batch (extracción masiva)

El usuario puede pegar una lista de URLs de LinkedIn y extraer todos:

```
Ingresa URLs (una por línea):
───────────────────────────────────
https://linkedin.com/in/juan-perez
https://linkedin.com/in/maria-garcia
https://linkedin.com/in/carlos-lopez
───────────────────────────────────
[▶ Extraer todas]

Progreso: ■■■□□□ 3/6

1. ✅ Juan Pérez        — Completado
2. ✅ María García      — Completado
3. ✅ Carlos López      — Completado
4. ⏳ Ana Martínez     — Extrayendo...
```

### 7. Modo stealth (anti-detección)

- Respetar límites de velocidad (1-2 segundos entre perfiles)
- No hacer clics, solo leer el DOM (no simula interacción humana)
- El usuario debe estar logueado en LinkedIn (la extensión usa su sesión)
- No almacena contraseñas ni tokens

---

## 🧪 Lo que NO hace (para no tener problemas legales)

| ❌ No hace | Por qué |
|-----------|---------|
| No envía solicitudes de amistad | Spam |
| No envía mensajes automáticos | Spam |
| No hace login automático | El usuario debe estar logueado |
| No almacena datos en servidores | Todo queda en el navegador |
| No viola ToS de LinkedIn | Solo extrae lo visible en pantalla |

---

## 📁 Estructura del proyecto

```
linkedin-profile-scraper/
├── manifest.json           ← Chrome Extension Manifest V3
├── popup.html              ← Interfaz principal
├── popup.js                ← Lógica del popup
├── content.js              ← Inyectado en LinkedIn, extrae datos
├── background.js           ← Background service worker
├── lib/
│   ├── csv-export.js       ← Exportar a CSV
│   ├── xlsx-export.js      ← Exportar a Excel
│   └── json-export.js      ← Exportar a JSON
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md               ← Documentación
└── guide.pdf               ← Guía de instalación para el comprador
```

---

## 💰 Precio y posicionamiento en Flippa

| Aspecto | Valor |
|---------|-------|
| **Precio sugerido** | $349 USD (fixed) |
| **Categoría** | Chrome Extensions |
| **Tags** | LinkedIn scraper, data extraction, lead generation, chrome extension |
| **Incluye** | Código fuente completo + assets + guía |

### Diferenciación

| Competencia | Precio | Limitación |
|------------|--------|-----------|
| Evaboot | $30/mes | SaaS pago mensual |
| Dux-Soup | $15/mes | SaaS pago mensual |
| **Nuestro** | **$349 única vez** | **Código fuente, es tuyo** |

---

## 📐 Para el comprador (lo que recibe)

```
📦 linkedin-profile-scraper.zip
├── src/              ← Código fuente completo
├── package.zip       ← Extensión lista para instalar en Chrome
├── README.md         ← Cómo funciona y cómo personalizar
└── guide.pdf         ← Guía de instalación paso a paso
```

El comprador puede:
- Revenderlo (white-label)
- Modificarlo
- Publicarlo en Chrome Web Store
- Usarlo para su propio negocio

---

## 🧪 Tests

- [ ] Extraer 10 perfiles de resultados de búsqueda
- [ ] Extraer perfil individual
- [ ] Exportar a CSV (abre correctamente en Excel)
- [ ] Exportar a Excel (formato correcto)
- [ ] Modo batch con 5 URLs
- [ ] Auto-scroll carga más resultados
- [ ] Respetar rate limiting (no bloquea LinkedIn)
- [ ] Funciona con y sin login de LinkedIn
