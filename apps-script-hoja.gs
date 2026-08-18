/**
 * Liquidación GNV — receptor para Google Sheets
 *
 * CÓMO INSTALARLO (una sola vez, ~3 minutos):
 * 1. Abre tu hoja de cálculo en Google Drive.
 * 2. Menú Extensiones → Apps Script. Borra lo que haya y pega TODO este archivo.
 * 3. Guarda (ícono de disquete).
 * 4. Botón "Implementar" → "Nueva implementación" → tipo "Aplicación web":
 *      · Ejecutar como:      Yo (tu cuenta)
 *      · Acceso:             Cualquier persona
 *    → Implementar → autoriza con tu cuenta → copia la URL (termina en /exec).
 * 5. En la app: Ajustes → "Respaldo en Google Sheets" → pega la URL y el token
 *    de abajo → Guardar → Probar.
 *
 * Si cambias el código después, usa "Implementar → Administrar implementaciones
 * → editar (lápiz) → Nueva versión". Si creas una implementación nueva, la URL cambia.
 */

const TOKEN = "gnv-unaluka-7k2m9x";   // el mismo que pondrás en la app
const HOJA  = "boletas";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    let d;
    try { d = JSON.parse(e.postData.contents); }
    catch (err) { return out({ ok: false, error: "json" }); }
    if (d.token !== TOKEN) return out({ ok: false, error: "token" });

    if (d.action === "ping") return out({ ok: true });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(HOJA);
    if (!sh) {
      sh = ss.insertSheet(HOJA);
      sh.appendRow(["id","recibido","fecha_emision","dia","semana_lunes","ruc",
                    "serie","numero","consumo","recaudo","pagado_grifo","fuente","estado"]);
      sh.getRange(1,1,1,13).setFontWeight("bold");
      sh.setFrozenRows(1);
    }
    const n = Math.max(sh.getLastRow() - 1, 1);
    const ids = sh.getRange(2, 1, n, 1).getValues().flat();

    if (d.action === "add") {
      const b = d.boleta || {};
      if (!b.id) return out({ ok: false, error: "boleta" });
      if (ids.indexOf(b.id) > -1) return out({ ok: true, dup: true }); // reenvío: no duplicar
      sh.appendRow([b.id, new Date(), b.fecha, b.dia, b.semana, "'" + (b.ruc||""),
                    b.serie||"", "'" + (b.numero||""), b.consumo, b.recaudo,
                    b.pagado||"", b.fuente||"", "activa"]);
      return out({ ok: true });
    }

    if (d.action === "del") {
      const i = ids.indexOf(d.id);
      if (i > -1) sh.getRange(i + 2, 13).setValue("eliminada"); // se marca, no se borra
      return out({ ok: true });
    }

    return out({ ok: false, error: "action" });
  } finally {
    lock.releaseLock();
  }
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
