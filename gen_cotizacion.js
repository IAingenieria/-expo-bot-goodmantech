"use strict";

const path = require("path");
const fs = require("fs");

const docxPath = "C:/Users/Dell/AppData/Roaming/npm/node_modules/docx";
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  LevelFormat,
  HeadingLevel,
  Footer,
  Header,
  PageNumber,
  NumberFormat,
  convertInchesToTwip,
} = require(docxPath);

const OUTPUT_PATH =
  "C:\\Users\\Dell\\Documents\\CLAUDE DESKTOP\\Expo Cintermex\\Cotizacion_Sistema_Telegram.docx";

// Colors
const NAVY = "1E3A5F";
const ORANGE = "E85D04";
const GRAY = "666666";
const LIGHT_GRAY_BG = "F8F9FA";
const LIGHT_BLUE_HDR = "D5E8F0";
const LIGHT_YELLOW = "FFFDE7";
const LIGHT_BLUE_BOX = "EBF3FB";
const LIGHT_ORANGE_BOX = "FEF3E2";
const LIGHT_GREEN_BOX = "E8F5E9";
const WHITE = "FFFFFF";

// Dimensions
const CONTENT_WIDTH = 10080; // DXA
const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 15840;
const MARGIN_TOP = 1440;
const MARGIN_BOTTOM = 1440;
const MARGIN_LEFT = 1080;
const MARGIN_RIGHT = 1080;

// Font
const FONT = "Arial";

// Current date
const now = new Date();
const dateStr = now.toLocaleDateString("es-MX", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

// ─── Helper: No borders object ───────────────────────────────────────────────
function noBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };
}

function cellNoBorders() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };
}

// ─── Helper: Section heading paragraph ───────────────────────────────────────
function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: ORANGE },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
        color: NAVY,
        font: FONT,
      }),
    ],
  });
}

// ─── Helper: Body paragraph ───────────────────────────────────────────────────
function bodyPara(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text,
        size: opts.size || 20, // 10pt
        color: opts.color || "000000",
        bold: opts.bold || false,
        italics: opts.italic || false,
        font: FONT,
      }),
    ],
  });
}

// ─── Helper: Empty paragraph ─────────────────────────────────────────────────
function emptyPara(size) {
  return new Paragraph({
    spacing: { before: size || 60, after: size || 60 },
    children: [new TextRun({ text: "", font: FONT })],
  });
}

// ─── Helper: Table cell with shading ─────────────────────────────────────────
function shadedCell(text, bgColor, opts = {}) {
  return new TableCell({
    width: opts.width
      ? { size: opts.width, type: WidthType.DXA }
      : { size: CONTENT_WIDTH / 2, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: bgColor, color: bgColor },
    borders: opts.borders || cellNoBorders(),
    margins: opts.margins || { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            size: opts.size || 20,
            color: opts.color || "000000",
            bold: opts.bold || false,
            font: FONT,
          }),
        ],
      }),
    ],
  });
}

// ─── HEADER (document header on each page) ───────────────────────────────────
function makePageHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: "[TU EMPRESA] | Sistema Inteligente vía Telegram | contacto@tuempresa.com | www.tuempresa.com",
            size: 16,
            color: GRAY,
            font: FONT,
          }),
        ],
      }),
    ],
  });
}

// ─── FOOTER (document footer on each page) ───────────────────────────────────
function makePageFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: "[TU EMPRESA] | Sistema Inteligente vía Telegram | contacto@tuempresa.com | www.tuempresa.com",
            size: 16,
            color: GRAY,
            font: FONT,
          }),
        ],
      }),
    ],
  });
}

// ─── SECTION 1: Document header visual ───────────────────────────────────────
function makeDocumentHeader() {
  return [
    // Navy bar effect via bottom border
    new Paragraph({
      spacing: { before: 0, after: 60 },
      border: {
        bottom: { style: BorderStyle.THICK, size: 24, color: NAVY },
      },
      shading: { type: ShadingType.CLEAR, fill: NAVY, color: NAVY },
      children: [
        new TextRun({
          text: "SISTEMA INTELIGENTE DE CAPTURA DE PROSPECTOS",
          bold: true,
          size: 36, // 18pt
          color: WHITE,
          font: FONT,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 80, after: 200 },
      children: [
        new TextRun({
          text: "Automatización Comercial vía Telegram",
          size: 22,
          color: GRAY,
          italics: true,
          font: FONT,
        }),
      ],
    }),
  ];
}

// ─── SECTION 2: Datos de la cotización ───────────────────────────────────────
function makeDatosCotizacion() {
  const colW1 = Math.floor(CONTENT_WIDTH * 0.35);
  const colW2 = CONTENT_WIDTH - colW1;

  const rows = [
    ["Folio:", "COT-EXPO-001"],
    ["Fecha:", dateStr],
    ["Validez:", "30 días naturales"],
    ["Elaboró:", "[TU NOMBRE / EMPRESA]"],
    ["Para:", "_________________________"],
    ["Evento:", "Expo Empaques 2026 — Monterrey"],
  ];

  const tableRows = rows.map(([label, value]) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: colW1, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE_HDR, color: LIGHT_BLUE_HDR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
          },
          margins: { top: 60, bottom: 60, left: 120, right: 80 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: label, bold: true, size: 20, color: NAVY, font: FONT }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colW2, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: WHITE, color: WHITE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
            right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
          },
          margins: { top: 60, bottom: 60, left: 120, right: 80 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: value, size: 20, color: "000000", font: FONT }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  return [
    sectionHeading("DATOS DE LA COTIZACIÓN"),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [colW1, colW2],
      rows: tableRows,
    }),
    emptyPara(120),
  ];
}

// ─── SECTION 3: ¿Qué problema resuelve? ──────────────────────────────────────
function makeProblema() {
  const bulletPoints = [
    "No tener tiempo de anotar todos los datos",
    "Perder tarjetas de presentación",
    "Olvidar los detalles de cada conversación",
    "No dar seguimiento a tiempo después del evento",
  ];

  return [
    sectionHeading("¿QUÉ PROBLEMA RESUELVE?"),
    bodyPara(
      "Durante una exposición comercial, cada minuto cuenta. Los vendedores en stand pierden prospectos valiosos por:"
    ),
    ...bulletPoints.map(
      (bp) =>
        new Paragraph({
          spacing: { before: 40, after: 40 },
          numbering: { reference: "bullet-list", level: 0 },
          children: [
            new TextRun({ text: bp, size: 20, color: "000000", font: FONT }),
          ],
        })
    ),
    emptyPara(60),
    bodyPara(
      "Este sistema elimina todos estos problemas de forma automática."
    ),
    emptyPara(120),
  ];
}

// ─── SECTION 4: ¿Cómo funciona? ──────────────────────────────────────────────
function makeComoFunciona() {
  const steps = [
    "El vendedor envía un AUDIO o una FOTO al chat de Telegram del sistema",
    "La inteligencia artificial transcribe el audio o lee la imagen automáticamente",
    "El sistema identifica: nombre, teléfono, email y empresa del prospecto",
    "Se genera automáticamente un resumen de la conversación",
    "El prospecto recibe en segundos un correo personalizado con una propuesta inicial en PDF",
    "El dato queda guardado en tu base de datos en la nube",
  ];

  return [
    sectionHeading("¿CÓMO FUNCIONA?"),
    ...steps.map(
      (step) =>
        new Paragraph({
          spacing: { before: 60, after: 60 },
          numbering: { reference: "decimal-list", level: 0 },
          children: [
            new TextRun({ text: step, size: 20, color: "000000", font: FONT }),
          ],
        })
    ),
    emptyPara(60),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text: "Todo esto ocurre en menos de 60 segundos, sin que el vendedor tenga que hacer nada más.",
          size: 20,
          color: GRAY,
          italics: true,
          font: FONT,
        }),
      ],
    }),
    emptyPara(120),
  ];
}

// ─── SECTION 5: ¿Qué incluye el sistema? ─────────────────────────────────────
function makeQueIncluye() {
  const colW1 = Math.floor(CONTENT_WIDTH * 0.38);
  const colW2 = CONTENT_WIDTH - colW1;

  const features = [
    ["Captura por Voz", "Graba un audio describiendo al prospecto y el sistema lo convierte a texto"],
    ["Captura por Imagen", "Fotografía una tarjeta de presentación y el sistema extrae todos los datos"],
    ["Extracción Inteligente con IA", "Identifica automáticamente nombre, teléfono, email y empresa"],
    ["Resumen de Conversación", "La IA genera un resumen profesional de lo discutido"],
    ["Correo Automático al Prospecto", "El cliente recibe un email personalizado al instante"],
    ["Propuesta en PDF Adjunta", "Se genera y adjunta una propuesta inicial en formato PDF"],
    ["Base de Datos en la Nube", "Todos los prospectos quedan organizados y disponibles 24/7"],
    ["Descarga a Excel", "Exporta toda tu lista de prospectos a Excel con un clic"],
    ["Compatible con Cualquier Celular", "Funciona desde WhatsApp... perdón, desde Telegram en iOS y Android"],
    ["Configuración Personalizada", "Con tu marca, datos de contacto, catálogo de productos y colores"],
  ];

  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: colW1, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE_HDR, color: LIGHT_BLUE_HDR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
          left: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
          right: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
        },
        margins: { top: 80, bottom: 80, left: 120, right: 80 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "FUNCIONALIDAD", bold: true, size: 20, color: NAVY, font: FONT }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: colW2, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: LIGHT_BLUE_HDR, color: LIGHT_BLUE_HDR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY },
          left: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
          right: { style: BorderStyle.SINGLE, size: 2, color: "AAAAAA" },
        },
        margins: { top: 80, bottom: 80, left: 120, right: 80 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "DESCRIPCIÓN", bold: true, size: 20, color: NAVY, font: FONT }),
            ],
          }),
        ],
      }),
    ],
  });

  const dataRows = features.map(([func, desc], idx) => {
    const bg = idx % 2 === 0 ? WHITE : LIGHT_GRAY_BG;
    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
    };
    return new TableRow({
      children: [
        new TableCell({
          width: { size: colW1, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: bg, color: bg },
          borders: cellBorders,
          margins: { top: 60, bottom: 60, left: 120, right: 80 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: func, bold: true, size: 20, color: NAVY, font: FONT }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colW2, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: bg, color: bg },
          borders: cellBorders,
          margins: { top: 60, bottom: 60, left: 120, right: 80 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: desc, size: 20, color: "000000", font: FONT }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  return [
    sectionHeading("¿QUÉ INCLUYE EL SISTEMA?"),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [colW1, colW2],
      rows: [headerRow, ...dataRows],
    }),
    emptyPara(120),
  ];
}

// ─── SECTION 6: Beneficios Clave ─────────────────────────────────────────────
function makeBeneficios() {
  const colW = Math.floor(CONTENT_WIDTH / 3);
  const colW3 = CONTENT_WIDTH - colW * 2;

  function benefitCell(emoji, title, desc, bgColor, width) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: bgColor, color: bgColor },
      borders: cellNoBorders(),
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 20 },
          children: [
            new TextRun({ text: emoji + " " + title, bold: true, size: 22, color: NAVY, font: FONT }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 20, after: 40 },
          children: [
            new TextRun({ text: desc, size: 18, color: "333333", font: FONT }),
          ],
        }),
      ],
    });
  }

  return [
    sectionHeading("BENEFICIOS CLAVE"),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [colW, colW, colW3],
      borders: noBorders(),
      rows: [
        new TableRow({
          children: [
            benefitCell(">>", "VELOCIDAD", "De conversacion a prospecto registrado en menos de 1 minuto", LIGHT_BLUE_BOX, colW),
            benefitCell("**", "PRECISION", "Nunca mas pierdas un dato. La IA captura todo lo importante", LIGHT_ORANGE_BOX, colW),
            benefitCell("++", "SEGUIMIENTO", "El prospecto recibe tu propuesta antes de que salga de tu stand", LIGHT_GREEN_BOX, colW3),
          ],
        }),
      ],
    }),
    emptyPara(120),
  ];
}

// ─── PAGE BREAK ───────────────────────────────────────────────────────────────
function makePageBreak() {
  return new Paragraph({
    pageBreakBefore: true,
    children: [],
  });
}

// ─── SECTION 7: Inversión ─────────────────────────────────────────────────────
function makeInversion() {
  const colW1 = Math.floor(CONTENT_WIDTH * 0.6);
  const colW2 = CONTENT_WIDTH - colW1;

  const pricingRows = [
    ["Precio base", "$8,000.00 MXN", false],
    ["IVA (16%)", "$1,280.00 MXN", false],
    ["TOTAL", "$9,280.00 MXN", true],
  ];

  const tableRows = pricingRows.map(([label, value, isBold]) => {
    const bg = isBold ? LIGHT_BLUE_HDR : WHITE;
    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
    };
    return new TableRow({
      children: [
        new TableCell({
          width: { size: colW1, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: bg, color: bg },
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 120, right: 80 },
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: label, bold: isBold, size: 22, color: isBold ? NAVY : "000000", font: FONT }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colW2, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: bg, color: bg },
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 120, right: 80 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: value, bold: isBold, size: 22, color: isBold ? NAVY : "000000", font: FONT }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  return [
    sectionHeading("INVERSIÓN"),
    // Highlighted box: light yellow background
    new Paragraph({
      spacing: { before: 120, after: 80 },
      border: {
        left: { style: BorderStyle.THICK, size: 16, color: ORANGE },
      },
      shading: { type: ShadingType.CLEAR, fill: LIGHT_YELLOW, color: LIGHT_YELLOW },
      children: [
        new TextRun({
          text: "  Sistema Completo de Captura de Prospectos vía Telegram",
          bold: true,
          size: 26,
          color: NAVY,
          font: FONT,
        }),
      ],
    }),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [colW1, colW2],
      rows: tableRows,
    }),
    emptyPara(80),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text: "Precio especial por contratación en evento. Válido únicamente durante Expo Empaques 2026.",
          size: 18,
          color: ORANGE,
          italics: true,
          font: FONT,
          bold: true,
        }),
      ],
    }),
    emptyPara(120),
  ];
}

// ─── SECTION 8: ¿Qué pasa después de contratar? ───────────────────────────────
function makeDepuesDeContratar() {
  const steps = [
    "Firmas esta cotización y realizas el 50% de anticipo ($4,640 MXN)",
    "Nos envías: logo de tu empresa, colores corporativos, catálogo de productos y datos de contacto",
    "En 3 a 5 días hábiles tienes tu sistema listo y funcionando",
    "Entregamos el sistema con una sesión de capacitación de 30 minutos vía videollamada",
    "Soporte técnico incluido por 30 días posteriores a la entrega",
  ];

  return [
    sectionHeading("¿QUÉ PASA DESPUÉS DE CONTRATAR?"),
    ...steps.map(
      (step) =>
        new Paragraph({
          spacing: { before: 60, after: 60 },
          numbering: { reference: "decimal-list2", level: 0 },
          children: [
            new TextRun({ text: step, size: 20, color: "000000", font: FONT }),
          ],
        })
    ),
    emptyPara(120),
  ];
}

// ─── SECTION 9: Términos y Condiciones ────────────────────────────────────────
function makeTerminos() {
  const terms = [
    "El sistema se entrega configurado con la información de tu empresa",
    "El cliente es responsable de las cuentas de Telegram, Gmail y los servicios de IA (costo aproximado $10-30 USD/mes según volumen)",
    "El anticipo del 50% confirma el pedido; el 50% restante se paga al momento de la entrega",
    "El precio incluye una sola instalación y configuración",
    "No incluye mantenimiento mensual (disponible por separado)",
  ];

  return [
    sectionHeading("TÉRMINOS Y CONDICIONES"),
    ...terms.map(
      (term) =>
        new Paragraph({
          spacing: { before: 40, after: 40 },
          numbering: { reference: "bullet-list2", level: 0 },
          children: [
            new TextRun({ text: term, size: 18, color: GRAY, font: FONT }),
          ],
        })
    ),
    emptyPara(120),
  ];
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\uF0B7",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 400, hanging: 200 },
                  spacing: { before: 40, after: 40 },
                },
                run: { font: "Symbol", size: 20 },
              },
            },
          ],
        },
        {
          reference: "bullet-list2",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\uF0B7",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 400, hanging: 200 },
                  spacing: { before: 40, after: 40 },
                },
                run: { font: "Symbol", size: 18 },
              },
            },
          ],
        },
        {
          reference: "decimal-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 480, hanging: 280 },
                  spacing: { before: 60, after: 60 },
                },
                run: { font: FONT, size: 20 },
              },
            },
          ],
        },
        {
          reference: "decimal-list2",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 480, hanging: 280 },
                  spacing: { before: 60, after: 60 },
                },
                run: { font: FONT, size: 20 },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: {
              top: MARGIN_TOP,
              right: MARGIN_RIGHT,
              bottom: MARGIN_BOTTOM,
              left: MARGIN_LEFT,
            },
          },
        },
        headers: {
          default: makePageHeader(),
        },
        footers: {
          default: makePageFooter(),
        },
        children: [
          // Document visual header
          ...makeDocumentHeader(),

          // Section 1: Datos
          ...makeDatosCotizacion(),

          // Section 2: Problema
          ...makeProblema(),

          // Section 3: Cómo funciona
          ...makeComoFunciona(),

          // Section 4: Qué incluye
          ...makeQueIncluye(),

          // Section 5: Beneficios
          ...makeBeneficios(),

          // Page break before Inversión
          makePageBreak(),

          // Section 6: Inversión
          ...makeInversion(),

          // Section 7: Después de contratar
          ...makeDepuesDeContratar(),

          // Section 8: Términos
          ...makeTerminos(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log("SUCCESS: File written to " + OUTPUT_PATH);
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
