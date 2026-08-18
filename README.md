# Liquidación GNV

App web para calcular el pago semanal del alquiler del taxi, descontando lo que el conductor ya pagó vía los tickets de recaudación de las boletas de GNV.

```
A PAGAR = (días trabajados × S/ 50) − (recaudos de la semana) + (arrastre negativo anterior)
```

- Tarifa: lunes a sábado
- Recaudos: descuentan todos los días, **domingo incluido**
- Recaudación = importe del consumo × 90% (calculado desde el QR, no leído por OCR)
- Si el resultado es negativo, se muestra como saldo a favor del conductor y se arrastra a la semana siguiente

## Subirlo a GitHub Pages

1. Crear un repo nuevo en github.com (público).
2. Subir `index.html` (botón **Add file → Upload files**).
3. **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
4. Esperar ~1 minuto. Queda en `https://TU-USUARIO.github.io/TU-REPO/`.
5. Abrir esa URL en el celular → menú de Chrome → **Agregar a pantalla de inicio**.

El paso de GitHub Pages no es opcional: **la cámara solo funciona bajo HTTPS**. Abriendo el archivo directo (`file://`) funcionan el registro manual y la subida de fotos, pero no el escaneo en vivo.

## Uso

- **Escanear**: apunta al QR de la boleta. Registra y calcula solo.
- **Manual**: si el QR no lee, basta el importe del consumo de G.N.V.
- **Semana**: detalle día por día y el monto a cobrar. Los interruptores marcan qué días trabajó (feriados, taller).
- **Ajustes**: tarifa, porcentaje, y exportar respaldo.

## Importante

Los datos se guardan **en el navegador del celular**. Si borras los datos de navegación, se pierden. Exporta el respaldo `.json` desde Ajustes cada cierto tiempo.

## Lector de QR

Tres capas, en orden:

1. **Lector nativo del celular** (BarcodeDetector) — usa el hardware, es el más rápido y preciso.
2. **jsQR sobre la imagen completa** — incrustado en el archivo, sin CDN, funciona sin conexión.
3. **jsQR por mosaicos** — divide la foto en una rejilla de 2×2 y 3×3 con solape y amplía cada recorte. Esto es lo que rescata los QR pequeños dentro de una foto grande.

Probado con QR de entre 130 y 600 px dentro de una foto de 3000×4000: **lee en todos los casos**, entre 0.5 y 1.4 segundos.

## Si algo no escanea

La pantalla de escaneo tiene un panel **Diagnóstico** que muestra si el lector cargó, si hay HTTPS, la resolución de la cámara y el contenido crudo del último QR leído. Si el QR se lee pero el formato no se reconoce, ese texto crudo es lo que hace falta para ajustar el parser.

Con la cámara abierta hay un botón de **linterna** (☀) arriba a la derecha: en papel térmico desvanecido hace mucha diferencia.
