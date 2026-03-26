// gen_cotizacion_goodman.js
// Generates Cotizacion_GoodmanTech.docx with real Goodman Tech brand colors and logo

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType, VerticalAlign,
  Footer, ImageRun,
} = require("C:/Users/Dell/AppData/Roaming/npm/node_modules/docx");
const fs = require("fs");
const path = require("path");
const https = require("https");

// --- LOGO DOWNLOAD ---
function downloadLogo(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        downloadLogo(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on("finish", () => { file.close(); resolve(dest); });
    }).on("error", err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// --- DATE HELPERS ---
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const day = now.getDate();
const pad = n => String(n).padStart(2, "0");
const YYYYMMDD = `${year}${pad(month)}${pad(day)}`;
const dateStr = `${month}/${day}/${year}`;
const vigDate = new Date(now);
vigDate.setDate(vigDate.getDate() + 30);
const vigStr = `${vigDate.getMonth()+1}/${vigDate.getDate()}/${vigDate.getFullYear()}`;
const folio = `COT${YYYYMMDD}${Math.floor(Math.random() * 900 + 100)}`;

// --- REAL BRAND COLORS (from quoteGenerator.ts) ---
const BLUE          = "0066CC";  // primary blue — header bg, total row
const TEAL          = "00897B";  // subtitle teal
const SECTION_BG    = "F8F9FA";  // client section background
const COND_BG       = "EBF3FB";  // conditions/banking box bg
const GRAY          = "616161";  // gray text
const DARK          = "1A1A2E";  // dark text
const WHITE         = "FFFFFF";
const BORDER_LIGHT  = "B0C4DE";
const GRAY_BORDER   = "CCCCCC";

// --- BORDER HELPERS ---
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noTableBorders = {
  top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
  insideH: noBorder, insideV: noBorder,
};
const blueBorder  = sz => ({ style: BorderStyle.SINGLE, size: sz, color: BLUE });
const grayBorder  = sz => ({ style: BorderStyle.SINGLE, size: sz, color: GRAY_BORDER });
const lightBorder = sz => ({ style: BorderStyle.SINGLE, size: sz, color: BORDER_LIGHT });

function cellBorders(b) {
  return { top: b, bottom: b, left: b, right: b };
}

// --- TEXT RUN HELPER ---
function txt(text, { bold=false, italic=false, size=18, color=DARK, font="Arial" }={}) {
  return new TextRun({ text, bold, italics: italic, size, color, font });
}

// --- SPACER PARAGRAPH ---
function spacer(after=140) {
  return new Paragraph({
    children: [new TextRun({ text: "", font: "Arial" })],
    spacing: { before: 0, after },
  });
}

// ============================================================
// MAIN ASYNC FUNCTION
// ============================================================
async function main() {
  // --- Download logo ---
  const logoUrl  = "https://i.ibb.co/TMRV7fVr/Logo-Goodman-Tech-1080-x-1080-px-VERSION-SM.png";
  const logoPath = "C:\\Users\\Dell\\Documents\\CLAUDE DESKTOP\\Expo Cintermex\\assets\\goodman_logo.png";
  let logoData   = null;

  try {
    console.log("Downloading logo...");
    await downloadLogo(logoUrl, logoPath);
    logoData = fs.readFileSync(logoPath);
    console.log("Logo downloaded successfully:", logoPath);
  } catch (err) {
    console.warn("Logo download failed, using text fallback:", err.message);
  }

  // --- Center cell content (logo or fallback) ---
  const centerCellChild = logoData
    ? new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: "png",
            data: logoData,
            transformation: { width: 80, height: 80 },
            altText: { title: "Logo", description: "Goodman Tech Logo", name: "logo" },
          }),
        ],
      })
    : new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [txt("[LOGO]", { bold: true, size: 28, color: TEAL })],
      });

  // ==========================================================
  // SECTION 1 — HEADER TABLE (3 columns)
  // ==========================================================
  const headerTable = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [3700, 2480, 3900],
    borders: noTableBorders,
    rows: [
      new TableRow({
        children: [
          // Left cell
          new TableCell({
            width: { size: 3700, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: cellBorders(noBorder),
            children: [
              new Paragraph({
                children: [txt("Goodman Tech", { bold: true, size: 32, color: BLUE })],
                spacing: { before: 0, after: 40 },
              }),
              new Paragraph({
                children: [txt("Soluciones Tecnológicas", { size: 20, color: TEAL })],
                spacing: { before: 0, after: 40 },
              }),
              new Paragraph({
                children: [txt("Zuazua #114 Col. Centro, Monterrey N.L. CP 64000", { size: 16, color: GRAY })],
                spacing: { before: 0, after: 20 },
              }),
              new Paragraph({
                children: [txt("Tel: 81 2635 0902  |  info@goodmantech.com.mx", { size: 16, color: GRAY })],
                spacing: { before: 0, after: 20 },
              }),
              new Paragraph({
                children: [txt("RFC: GMT000000XXX", { size: 16, color: GRAY })],
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
          // Center cell — logo
          new TableCell({
            width: { size: 2480, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: cellBorders(noBorder),
            children: [centerCellChild],
          }),
          // Right cell — quote info
          new TableCell({
            width: { size: 3900, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: cellBorders(noBorder),
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [txt("COTIZACIÓN", { bold: true, size: 40, color: BLUE })],
                spacing: { before: 0, after: 40 },
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [txt(folio, { bold: true, size: 22, color: BLUE })],
                spacing: { before: 0, after: 20 },
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [txt(`Fecha: ${dateStr}`, { size: 18, color: GRAY })],
                spacing: { before: 0, after: 20 },
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [txt(`Vigencia: ${vigStr}`, { size: 18, color: GRAY })],
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ==========================================================
  // SEPARATOR LINE
  // ==========================================================
  const separator = new Paragraph({
    children: [],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE },
    },
    spacing: { before: 120, after: 120 },
  });

  // ==========================================================
  // SECTION 2 — DATOS DEL CLIENTE
  // ==========================================================
  const clientTable = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [10080],
    borders: noTableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10080, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: SECTION_BG },
            borders: cellBorders(lightBorder(4)),
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [txt("DATOS DEL CLIENTE", { bold: true, size: 20, color: BLUE })],
                spacing: { before: 0, after: 80 },
              }),
              new Paragraph({
                children: [txt("Cliente:  ________________________________", { size: 20, color: DARK })],
                spacing: { before: 60, after: 0 },
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ==========================================================
  // SECTION 3 — SERVICES TABLE
  // ==========================================================
  const features = [
    "Captura por voz: graba un audio y el sistema transcribe y registra al prospecto automáticamente",
    "Captura por imagen: fotografía una tarjeta de presentación y extrae todos los datos",
    "Extracción automática con IA: nombre, teléfono, email y empresa del prospecto",
    "Resumen de conversación generado con Inteligencia Artificial",
    "Correo personalizado al prospecto en segundos, con propuesta inicial en PDF adjunto",
    "Base de datos en la nube con todos tus prospectos capturados (acceso 24/7)",
    "Descarga de toda tu lista de prospectos a Excel con un clic",
    "Configuración personalizada con tu marca, colores y catálogo de productos",
    "Sesión de capacitación de 30 min por videollamada",
    "Soporte técnico por 30 días posteriores a la entrega",
  ];

  const descChildren = [
    new Paragraph({
      children: [txt("Sistema Inteligente de Captura de Prospectos vía Telegram", { bold: true, size: 20, color: DARK })],
      spacing: { before: 0, after: 40 },
    }),
    new Paragraph({
      children: [txt("Automatización comercial con Inteligencia Artificial", { italic: true, size: 18, color: GRAY })],
      spacing: { before: 0, after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "", font: "Arial" })],
      spacing: { before: 0, after: 80 },
    }),
    new Paragraph({
      children: [txt("Entregables incluidos:", { bold: true, size: 18, color: DARK })],
      spacing: { before: 0, after: 40 },
    }),
    ...features.map(f =>
      new Paragraph({
        children: [txt(`- ${f}`, { size: 18, color: DARK })],
        indent: { left: 200 },
        spacing: { before: 40, after: 40 },
      })
    ),
  ];

  const servicesTable = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [480, 580, 6990, 1015, 1015],
    borders: noTableBorders,
    rows: [
      // Header row
      new TableRow({
        children: [
          ...[
            { text: "NO.",                                      width: 480,  align: AlignmentType.CENTER },
            { text: "CANT.",                                    width: 580,  align: AlignmentType.CENTER },
            { text: "DESCRIPCIÓN DEL SERVICIO / PRODUCTO",      width: 6990, align: AlignmentType.LEFT   },
            { text: "P. UNITARIO",                              width: 1015, align: AlignmentType.CENTER },
            { text: "IMPORTE",                                  width: 1015, align: AlignmentType.CENTER },
          ].map(col =>
            new TableCell({
              width: { size: col.width, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, fill: BLUE },
              borders: cellBorders(blueBorder(1)),
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
              children: [
                new Paragraph({
                  alignment: col.align,
                  children: [txt(col.text, { bold: true, size: 18, color: WHITE })],
                }),
              ],
            })
          ),
        ],
      }),
      // Service row
      new TableRow({
        children: [
          // NO.
          new TableCell({
            width: { size: 480, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: cellBorders(grayBorder(1)),
            margins: { top: 80, bottom: 80, left: 60, right: 60 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [txt("1", { size: 18, color: DARK })] })],
          }),
          // CANT.
          new TableCell({
            width: { size: 580, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: cellBorders(grayBorder(1)),
            margins: { top: 80, bottom: 80, left: 60, right: 60 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [txt("1", { size: 18, color: DARK })] })],
          }),
          // DESCRIPCIÓN
          new TableCell({
            width: { size: 6990, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: cellBorders(grayBorder(1)),
            margins: { top: 80, bottom: 80, left: 160, right: 160 },
            children: descChildren,
          }),
          // P. UNITARIO
          new TableCell({
            width: { size: 1015, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: cellBorders(grayBorder(1)),
            margins: { top: 80, bottom: 80, left: 60, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [txt("$8,000.00", { size: 18, color: DARK })] })],
          }),
          // IMPORTE
          new TableCell({
            width: { size: 1015, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            borders: cellBorders(grayBorder(1)),
            margins: { top: 80, bottom: 80, left: 60, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [txt("$8,000.00", { size: 18, color: DARK })] })],
          }),
        ],
      }),
    ],
  });

  // ==========================================================
  // SECTION 4 — TOTALS
  // ==========================================================
  const innerTotalsTable = new Table({
    width: { size: 4500, type: WidthType.DXA },
    columnWidths: [3000, 1500],
    borders: noTableBorders,
    rows: [
      // Subtotal
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3000, type: WidthType.DXA },
            borders: cellBorders(grayBorder(1)),
            margins: { top: 60, bottom: 60, left: 120, right: 60 },
            children: [new Paragraph({ children: [txt("Subtotal:", { bold: true, size: 18, color: DARK })] })],
          }),
          new TableCell({
            width: { size: 1500, type: WidthType.DXA },
            borders: cellBorders(grayBorder(1)),
            margins: { top: 60, bottom: 60, left: 60, right: 100 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [txt("$8,000.00", { size: 18, color: DARK })] })],
          }),
        ],
      }),
      // IVA
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3000, type: WidthType.DXA },
            borders: cellBorders(grayBorder(1)),
            margins: { top: 60, bottom: 60, left: 120, right: 60 },
            children: [new Paragraph({ children: [txt("IVA (16%):", { bold: true, size: 18, color: DARK })] })],
          }),
          new TableCell({
            width: { size: 1500, type: WidthType.DXA },
            borders: cellBorders(grayBorder(1)),
            margins: { top: 60, bottom: 60, left: 60, right: 100 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [txt("$1,280.00", { size: 18, color: DARK })] })],
          }),
        ],
      }),
      // TOTAL
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3000, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: BLUE },
            borders: cellBorders(blueBorder(1)),
            margins: { top: 80, bottom: 80, left: 120, right: 60 },
            children: [new Paragraph({ children: [txt("TOTAL:", { bold: true, size: 20, color: WHITE })] })],
          }),
          new TableCell({
            width: { size: 1500, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: BLUE },
            borders: cellBorders(blueBorder(1)),
            margins: { top: 80, bottom: 80, left: 60, right: 100 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [txt("$9,280.00", { bold: true, size: 20, color: WHITE })] })],
          }),
        ],
      }),
    ],
  });

  const totalsWrapper = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [5580, 4500],
    borders: noTableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5580, type: WidthType.DXA },
            borders: cellBorders(noBorder),
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 4500, type: WidthType.DXA },
            borders: cellBorders(noBorder),
            children: [innerTotalsTable],
          }),
        ],
      }),
    ],
  });

  // ==========================================================
  // SECTION 5 — CONDITIONS + BANKING
  // ==========================================================
  function boldLabel(label, rest, { spacingBefore=0 }={}) {
    return new Paragraph({
      children: [
        txt(label, { bold: true, size: 18, color: DARK }),
        txt(rest,  { size: 18, color: DARK }),
      ],
      spacing: { before: spacingBefore, after: 40 },
    });
  }

  const bottomTable = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [4860, 5220],
    borders: noTableBorders,
    rows: [
      new TableRow({
        children: [
          // Left — Condiciones de pago
          new TableCell({
            width: { size: 4860, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: COND_BG },
            borders: cellBorders(lightBorder(4)),
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [txt("CONDICIONES DE PAGO", { bold: true, size: 18, color: BLUE })],
                spacing: { before: 0, after: 80 },
              }),
              new Paragraph({
                children: [txt("- 50% de anticipo para iniciar", { size: 18, color: DARK })],
                spacing: { before: 80, after: 40 },
              }),
              new Paragraph({
                children: [txt("- 50% restante al finalizar", { size: 18, color: DARK })],
                spacing: { before: 0, after: 40 },
              }),
              new Paragraph({
                children: [txt("- Precios en MXN", { size: 18, color: DARK })],
                spacing: { before: 0, after: 40 },
              }),
              new Paragraph({
                children: [txt("- Entrega en 3 a 5 días hábiles", { size: 18, color: DARK })],
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
          // Right — Datos bancarios
          new TableCell({
            width: { size: 5220, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: COND_BG },
            borders: cellBorders(lightBorder(4)),
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [txt("DATOS BANCARIOS", { bold: true, size: 18, color: BLUE })],
                spacing: { before: 0, after: 80 },
              }),
              boldLabel("Beneficiario: ", "Guadalupe Salinas Baños",    { spacingBefore: 80 }),
              boldLabel("Banco: ",         "MERCADO PAGO"),
              boldLabel("CLABE INTERBANCARIA: ", "7229 6901 0455 5450 66"),
            ],
          }),
        ],
      }),
    ],
  });

  // ==========================================================
  // SECTION 6 — VALIDITY NOTICE
  // ==========================================================
  const noticeTable = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [10080],
    borders: noTableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10080, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: BLUE },
            borders: cellBorders(noBorder),
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [txt(
                  "Esta cotización tiene una vigencia de 30 días a partir de la fecha de emisión",
                  { size: 18, color: WHITE }
                )],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ==========================================================
  // FOOTER
  // ==========================================================
  const footerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
    },
    spacing: { before: 60 },
    children: [
      txt(
        "Goodman Tech  |  Zuazua #114 Col. Centro, Monterrey N.L. CP 64000  |  Tel: 81 2635 0902  |  info@goodmantech.com.mx",
        { size: 16, color: GRAY }
      ),
    ],
  });

  // ==========================================================
  // DOCUMENT ASSEMBLY
  // ==========================================================
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        footers: {
          default: new Footer({ children: [footerParagraph] }),
        },
        children: [
          headerTable,
          spacer(100),
          separator,
          spacer(100),
          clientTable,
          spacer(140),
          servicesTable,
          spacer(140),
          totalsWrapper,
          spacer(140),
          bottomTable,
          spacer(140),
          noticeTable,
        ],
      },
    ],
  });

  // ==========================================================
  // WRITE FILE
  // ==========================================================
  const outPath = "C:\\Users\\Dell\\Documents\\CLAUDE DESKTOP\\Expo Cintermex\\Cotizacion_GoodmanTech.docx";
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log("SUCCESS: File written to", outPath);
  console.log("Folio:", folio);
  console.log("Logo included:", logoData !== null);
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
