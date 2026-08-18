# CONTEXT.md — Liquidación GNV (leer antes de modificar)

Contexto completo para retomar el desarrollo en una conversación nueva de Claude.
Repo: `sebassoto-hub/BOLETAS-GNV` · App publicada: https://sebassoto-hub.github.io/BOLETAS-GNV/

## Qué hace

El dueño alquila un auto para taxi (placa H2A395) convertido a GNV. La deuda de la
conversión se paga vía un recargo del 90% en cada tanqueada ("ticket de recaudación").
La app escanea las boletas del grifo y calcula la liquidación semanal.

## Reglas de negocio (definidas por el dueño, no cambiar sin preguntar)

- Tarifa: S/ 50 por día trabajado, **lunes a sábado**. Domingo nunca paga tarifa.
- Recaudos: descuentan **todos los días, domingo incluido** (ventanas distintas: tarifa 6 días, recaudos 7).
- `A PAGAR = (días trabajados × tarifa) − (suma de recaudos de la semana) + arrastre`
- Si sale negativo: **saldo a favor del conductor**, se arrastra a la semana siguiente
  (encadenado desde la primera semana con datos; solo viaja lo negativo). Se muestra explícito.
- Feriados/días no trabajados: interruptores por día en la vista Semana.
- Recaudación = consumo × pct (configurable, hoy 90%). Se CALCULA, nunca se lee por OCR.

## El QR del grifo (GESO DEL PERU, RUC 20613116525) — dato crítico

Formato real confirmado (9 campos, sin hash):
```
20613116525|03|B001|15220|4.78|59.57|2026-07-16|0|00000000
```
**Trampa:** el campo de monto trae el TOTAL A PAGAR (consumo+recaudo), NO el importe
de la boleta. `ajustarConsumo()` lo detecta usando el IGV (consumo = IGV×118/18) y
separa 59.57 → 31.35 + 28.22. Si el QR ya trae el consumo, no toca nada. Sin IGV, no especula.
El parser (`parseQR`) también acepta cadenas pipe estándar SUNAT y URLs con query params.

## Arquitectura

- **index.html** — archivo ÚNICO publicado. Todo inline. Sin CDN (una CDN rota causó el primer bug grave).
- **app.part.html** — FUENTE editable. Igual a index.html pero con `/*__JSQR__*/` en lugar
  de la librería. **Editar siempre este, nunca index.html directamente.**
- **jsqr.min.js** — jsQR v1.4.0 minificado (npm pack jsqr + esbuild --minify), con este apéndice:
  `if(typeof jsQR==='undefined'&&typeof window!=='undefined'&&window.jsQR){var jsQR=window.jsQR;}`
- **Build:** reemplazar `/*__JSQR__*/` en app.part.html por el contenido de jsqr.min.js → index.html.
- **apps-script-hoja.gs** — receptor Google Apps Script (pegado en la hoja del dueño,
  desplegado como Web App: ejecutar como él, acceso cualquiera). Token: `gnv-unaluka-7k2m9x`.
  La URL /exec NO está en el repo (vive en el localStorage de cada celular). Si se cambia el
  código del script: Implementar → Administrar implementaciones → editar → nueva versión
  (una implementación nueva cambia la URL y hay que reconfigurar los celulares).

### Lectura de QR (3 capas, en orden)
1. BarcodeDetector nativo (Android; iOS no lo tiene)
2. jsQR sobre imagen completa
3. jsQR por mosaicos: rejillas 2×2 y 3×3 con solape 25%, cada recorte ampliado a ~1000px,
   con preprocesos crudo → binarizado Otsu → realce de contraste. Lee QR desde 130px
   dentro de fotos 3000×4000. Fotos: selección múltiple, resumen al final.

### Sincronización con Google Sheets
- Cada alta/borrado se encola en `DB.sync.cola` y se envía con fetch POST
  `Content-Type: text/plain` (evita preflight CORS — requisito de Apps Script).
- Cola offline persistente; reintentos al volver señal (evento online + intervalo 45s).
- Antiduplicado en el servidor por `id`. Borrados se marcan "eliminada", no se borra la fila.
- Respuesta `{ok:false}` (p.ej. token malo) NO desecha la cola.

### Datos (localStorage, clave `gnv_liq_v1`)
`{boletas:[{id,ruc,tipo,serie,numero,fecha,total,recaudo,pagado,fuente,raw}],
  libres:{fecha:1}, cfg:{tarifa,pct,placa}, cfgHist:[{f,q}], sync:{url,token,cola}}`
- Fechas SIEMPRE "YYYY-MM-DD" ancladas a mediodía UTC (`D()`/`S()`/`addD`/`lunes`), zona America/Lima.
- Antiduplicado local: clave ruc|serie|numero cuando hay numero (manual: numero opcional, últimos 4 dígitos).
- Registro manual: el usuario ingresa el TOTAL A PAGAR; `desdePagado()` separa consumo+recaudo.
- Parámetros del acuerdo bloqueados tras guardar (botón Editar) + historial de cambios.

## UI

Liquid glass estilo iOS: fondo #152541 con blobs animados (#bg), tarjetas con
backdrop-filter blur+saturate, nav cápsula flotante, fallback @supports sólido para
navegadores sin blur. El dueño pidió el fondo "no muy oscuro" — actual #152541.
El toast usa opacity+visibility además de transform (en iOS solo-transform quedaba visible).

## Cómo probar (obligatorio antes de push)

Suites en jsdom contra el index.html YA construido (patrón usado: canvas simulado que
delega recorte/escala a Pillow, fetch simulado para sync). Cubren: parseQR con la cadena
real del grifo, ajustarConsumo, semanas/arrastre encadenado, antiduplicados, fotos
múltiples, desplegables, candado de parámetros, cola de sync con cortes de red.
Verificación aritmética contra boletas reales: 31.35→28.22 (total 59.57) y 33.63→30.27 (63.90).

## Cómo publicar

```
git clone https://x-access-token:TOKEN@github.com/sebassoto-hub/BOLETAS-GNV.git
# build → copiar index.html → commit → push a main
```
GitHub Pages sirve main/(root); tarda 1–2 min + caché ~10 min. El usuario recarga con
`?v=N`. El PAT (fine-grained, solo este repo, Contents RW) lo da el dueño en el chat;
pedirle uno nuevo si expiró. La sandbox de Claude alcanza github.com pero NO github.io.

## Pendientes conocidos / ideas

- PWA instalable real (manifest + service worker) — hoy se usa "Agregar a pantalla de inicio".
- Verificación por visión (placa, % impreso) — descartada por ahora: costo $0 es requisito.
- El conductor usa la misma URL+token en su celular; ambos alimentan la misma hoja.
