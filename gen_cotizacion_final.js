const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, ImageRun, AlignmentType, WidthType, BorderStyle,
  ShadingType, VerticalAlign, LevelFormat, HeadingLevel,
  convertInchesToTwip, Footer, Header
} = require("C:\\Users\\Dell\\AppData\\Roaming\\npm\\node_modules\\docx");
const fs = require("fs");
const path = require("path");

// ─── DATE / FOLIO ──────────────────────────────────────────────────────────
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
const rand3 = String(Math.floor(Math.random() * 900) + 100);
const folio = `COT${yyyy}${mm}${dd}${rand3}`;
const fechaStr = `${now.getMonth() + 1}/${now.getDate()}/${yyyy}`;
const vigDate = new Date(now); vigDate.setDate(vigDate.getDate() + 30);
const vigStr = `${vigDate.getMonth() + 1}/${vigDate.getDate()}/${vigDate.getFullYear()}`;

// ─── LOGO ──────────────────────────────────────────────────────────────────
const LOGO_PATH = "C:\\Users\\Dell\\Documents\\CLAUDE DESKTOP\\Expo Cintermex\\assets\\goodman_logo.png";
let logoData = null;
let logoEmbedded = false;
try {
  logoData = fs.readFileSync(LOGO_PATH);
  logoEmbedded = true;
} catch (e) {
  console.warn("Logo not found, using fallback text.");
}

// ─── BORDER HELPERS ────────────────────────────────────────────────────────
const nb = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const b0066 = { style: BorderStyle.SINGLE, size: 4, color: "0066CC" };
const bCCCC = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const bB0C4 = { style: BorderStyle.SINGLE, size: 4, color: "B0C4DE" };

function noOuterBorders() {
  return { top: nb, bottom: nb, left: nb, right: nb, insideH: nb, insideV: nb };
}
function allCellBorders(color) {
  const b = { style: BorderStyle.SINGLE, size: 4, color };
  return { top: b, bottom: b, left: b, right: b };
}

// ─── FONT HELPER ───────────────────────────────────────────────────────────
function r(text, { bold = false, size = 20, color = "1A1A2E", italic = false } = {}) {
  return new TextRun({
    text,
    bold,
    italics: italic,
    color,
    size,
    font: "Arial",
  });
}

// ─── SECTION HEADING ───────────────────────────────────────────────────────
function sectionHeading(text, { color = "0066CC", size = 22 } = {}) {
  return new Paragraph({
    children: [r(text, { bold: true, size, color })],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color },
    },
    spacing: { after: 160, before: 160 },
  });
}

function spacer(after = 140) {
  return new Paragraph({ children: [], spacing: { after } });
}

// ─── SECTION 1: HEADER TABLE ───────────────────────────────────────────────
function makeHeader() {
  // Left cell
  const leftCellChildren = [
    new Paragraph({ children: [r("Goodman Tech", { bold: true, size: 32, color: "0066CC" })], spacing: { after: 40 } }),
    new Paragraph({ children: [r("Soluciones Tecnológicas", { size: 20, color: "00897B" })], spacing: { after: 40 } }),
    new Paragraph({ children: [r("Zuazua #114 Col. Centro, Monterrey N.L. CP 64000", { size: 16, color: "616161" })], spacing: { after: 20 } }),
    new Paragraph({ children: [r("Tel: 81 2635 0902  |  info@goodmantech.com.mx", { size: 16, color: "616161" })], spacing: { after: 20 } }),
    new Paragraph({ children: [r("RFC: GMT000000XXX", { size: 16, color: "616161" })], spacing: { after: 0 } }),
  ];

  // Center cell (logo or fallback)
  let centerContent;
  if (logoEmbedded) {
    centerContent = new Paragraph({
      children: [
        new ImageRun({
          data: logoData,
          type: "png",
          transformation: { width: 80, height: 80 },
          altText: { title: "Logo", description: "Goodman Tech", name: "logo" },
        }),
      ],
      alignment: AlignmentType.CENTER,
    });
  } else {
    centerContent = new Paragraph({
      children: [r("[LOGO]", { bold: true, size: 28, color: "00897B" })],
      alignment: AlignmentType.CENTER,
    });
  }

  // Right cell
  const rightCellChildren = [
    new Paragraph({ children: [r("COTIZACIÓN", { bold: true, size: 40, color: "0066CC" })], alignment: AlignmentType.RIGHT, spacing: { after: 40 } }),
    new Paragraph({ children: [r(folio, { bold: true, size: 22, color: "0066CC" })], alignment: AlignmentType.RIGHT, spacing: { after: 30 } }),
    new Paragraph({ children: [r(`Fecha: ${fechaStr}`, { size: 18, color: "616161" })], alignment: AlignmentType.RIGHT, spacing: { after: 20 } }),
    new Paragraph({ children: [r(`Vigencia: ${vigStr}`, { size: 18, color: "616161" })], alignment: AlignmentType.RIGHT }),
  ];

  return new Table({
    width: { size: 10080, type: WidthType.DXA },
    borders: noOuterBorders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3700, type: WidthType.DXA },
            borders: { top: nb, bottom: nb, left: nb, right: nb },
            verticalAlign: VerticalAlign.TOP,
            children: leftCellChildren,
          }),
          new TableCell({
            width: { size: 2480, type: WidthType.DXA },
            borders: { top: nb, bottom: nb, left: nb, right: nb },
            verticalAlign: VerticalAlign.CENTER,
            children: [centerContent],
          }),
          new TableCell({
            width: { size: 3900, type: WidthType.DXA },
            borders: { top: nb, bottom: nb, left: nb, right: nb },
            verticalAlign: VerticalAlign.TOP,
            children: rightCellChildren,
          }),
        ],
      }),
    ],
  });
}

// ─── SECTION 2: INTRO TITLE (boxed) ────────────────────────────────────────
function makeIntroBox() {
  return new Table({
    width: { size: 10080, type: WidthType.DXA },
    borders: noOuterBorders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10080, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "F8F9FA" },
            borders: { top: nb, bottom: { style: BorderStyle.SINGLE, size: 6, color: "0066CC" }, left: nb, right: nb },
            margins: { top: 140, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [r("SISTEMA INTELIGENTE DE CAPTURA DE PROSPECTOS VÍA TELEGRAM", { bold: true, size: 26, color: "0066CC" })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [r("Automatización Comercial con Inteligencia Artificial", { size: 18, color: "616161", italic: true })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ─── SEPARATOR LINE ─────────────────────────────────────────────────────────
function separatorLine() {
  return new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "0066CC" } },
    spacing: { before: 120, after: 120 },
  });
}

// ─── SECTION 3: PROBLEMA ───────────────────────────────────────────────────
function makeProblema() {
  return [
    sectionHeading("¿QUÉ PROBLEMA RESUELVE?"),
    new Paragraph({
      children: [r(
        "Durante una exposición comercial, cada minuto cuenta. Los vendedores en stand pierden prospectos valiosos por no tener tiempo de anotar todos los datos, perder tarjetas de presentación, olvidar los detalles de cada conversación o no dar seguimiento a tiempo. Este sistema elimina todos estos problemas de forma automática.",
        { size: 20, color: "1A1A2E" }
      )],
      spacing: { after: 140 },
    }),
    spacer(140),
  ];
}

// ─── SECTION 4: CÓMO FUNCIONA ──────────────────────────────────────────────
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
    ...steps.map((text, i) => new Paragraph({
      children: [r(text, { size: 20, color: "1A1A2E" })],
      numbering: { reference: "steps", level: 0 },
      spacing: { after: 80 },
    })),
    new Paragraph({
      children: [r("Todo esto ocurre en menos de 60 segundos, sin que el vendedor tenga que hacer nada más.", { size: 18, color: "616161", italic: true })],
      spacing: { before: 100, after: 140 },
    }),
    spacer(140),
  ];
}

// ─── SECTION 5: FEATURES TABLE ─────────────────────────────────────────────
function makeFeaturesTable() {
  const features = [
    ["Captura por Voz", "Graba un audio describiendo al prospecto y el sistema lo convierte a texto"],
    ["Captura por Imagen", "Fotografía una tarjeta de presentación y el sistema extrae todos los datos"],
    ["Extracción Inteligente con IA", "Identifica automáticamente nombre, teléfono, email y empresa"],
    ["Resumen de Conversación", "La IA genera un resumen profesional de lo discutido"],
    ["Correo Automático al Prospecto", "El cliente recibe un email personalizado al instante"],
    ["Propuesta en PDF Adjunta", "Se genera y adjunta una propuesta inicial en formato PDF"],
    ["Base de Datos en la Nube", "Todos los prospectos quedan organizados y disponibles 24/7"],
    ["Descarga a Excel", "Exporta toda tu lista de prospectos a Excel con un clic"],
    ["Compatible con Cualquier Celular", "Funciona desde Telegram en iOS y Android"],
    ["Configuración Personalizada", "Con tu marca, datos de contacto, catálogo de productos y colores"],
  ];

  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 3600, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: "0066CC" },
        borders: allCellBorders("0066CC"),
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [r("FUNCIONALIDAD", { bold: true, size: 18, color: "FFFFFF" })] })],
      }),
      new TableCell({
        width: { size: 6480, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, color: "auto", fill: "0066CC" },
        borders: allCellBorders("0066CC"),
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [r("DESCRIPCIÓN", { bold: true, size: 18, color: "FFFFFF" })] })],
      }),
    ],
  });

  const dataRows = features.map(([func, desc], i) => {
    const fill = i % 2 === 1 ? "FAFAFA" : "FFFFFF";
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 3600, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: "auto", fill },
          borders: allCellBorders("CCCCCC"),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [r(func, { size: 18, color: "1A1A2E", bold: true })] })],
        }),
        new TableCell({
          width: { size: 6480, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: "auto", fill },
          borders: allCellBorders("CCCCCC"),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [r(desc, { size: 18, color: "1A1A2E" })] })],
        }),
      ],
    });
  });

  return [
    sectionHeading("¿QUÉ INCLUYE EL SISTEMA?"),
    new Table({
      width: { size: 10080, type: WidthType.DXA },
      borders: noOuterBorders(),
      rows: [headerRow, ...dataRows],
    }),
    spacer(140),
  ];
}

// ─── SECTION 6: BENEFICIOS ─────────────────────────────────────────────────
function makeBeneficios() {
  function benefCell(width, fill, title, body) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill },
      borders: { top: nb, bottom: nb, left: nb, right: nb },
      margins: { top: 160, bottom: 160, left: 180, right: 180 },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({ children: [r(title, { bold: true, size: 22, color: "0066CC" })], spacing: { after: 80 } }),
        new Paragraph({ children: [r(body, { size: 18, color: "1A1A2E" })] }),
      ],
    });
  }

  return [
    sectionHeading("BENEFICIOS CLAVE"),
    new Table({
      width: { size: 10080, type: WidthType.DXA },
      borders: noOuterBorders(),
      rows: [
        new TableRow({
          children: [
            benefCell(3260, "EBF3FB", "VELOCIDAD", "De conversación a prospecto registrado en menos de 1 minuto"),
            benefCell(3260, "FFF3E0", "PRECISIÓN", "Nunca más pierdas un dato. La IA captura todo lo importante"),
            benefCell(3560, "E8F5E9", "SEGUIMIENTO", "El prospecto recibe tu propuesta antes de que salga de tu stand"),
          ],
        }),
      ],
    }),
    spacer(200),
  ];
}

// ─── SECTION 7: INVERSIÓN ──────────────────────────────────────────────────
function makeInversion() {
  // Highlighted box
  const highlightBox = new Table({
    width: { size: 10080, type: WidthType.DXA },
    borders: noOuterBorders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10080, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFF9C4" },
            borders: {
              top: nb, bottom: nb, right: nb,
              left: { style: BorderStyle.SINGLE, size: 12, color: "E65100" },
            },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [r("Sistema Completo de Captura de Prospectos vía Telegram", { bold: true, size: 22, color: "1A1A2E" })],
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [r("Precio especial por contratación en evento. Válido únicamente durante Expo Empaques 2026.", { size: 16, color: "E65100", italic: true })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Inner pricing table
  const priceRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          borders: allCellBorders("CCCCCC"),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [r("Precio base", { size: 18, color: "1A1A2E" })] })],
        }),
        new TableCell({
          width: { size: 1500, type: WidthType.DXA },
          borders: allCellBorders("CCCCCC"),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [r("$8,000.00 MXN", { size: 18, color: "1A1A2E" })], alignment: AlignmentType.RIGHT })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          borders: allCellBorders("CCCCCC"),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [r("IVA (16%)", { size: 18, color: "1A1A2E" })] })],
        }),
        new TableCell({
          width: { size: 1500, type: WidthType.DXA },
          borders: allCellBorders("CCCCCC"),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [r("$1,280.00 MXN", { size: 18, color: "1A1A2E" })], alignment: AlignmentType.RIGHT })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 3000, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "0066CC" },
          borders: allCellBorders("0066CC"),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [r("TOTAL", { bold: true, size: 18, color: "FFFFFF" })] })],
        }),
        new TableCell({
          width: { size: 1500, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "0066CC" },
          borders: allCellBorders("0066CC"),
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [r("$9,280.00 MXN", { bold: true, size: 18, color: "FFFFFF" })], alignment: AlignmentType.RIGHT })],
        }),
      ],
    }),
  ];

  const innerPriceTable = new Table({
    width: { size: 4500, type: WidthType.DXA },
    borders: noOuterBorders(),
    rows: priceRows,
  });

  // Wrapper: left empty cell + right cell with price table
  const priceWrapper = new Table({
    width: { size: 10080, type: WidthType.DXA },
    borders: noOuterBorders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5580, type: WidthType.DXA },
            borders: { top: nb, bottom: nb, left: nb, right: nb },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 4500, type: WidthType.DXA },
            borders: { top: nb, bottom: nb, left: nb, right: nb },
            children: [innerPriceTable],
          }),
        ],
      }),
    ],
  });

  return [
    sectionHeading("INVERSIÓN", { color: "E65100" }),
    highlightBox,
    spacer(100),
    priceWrapper,
    spacer(140),
  ];
}

// ─── SECTION 8: DESPUÉS DE CONTRATAR ──────────────────────────────────────
function makePostContrato() {
  const steps = [
    "Firmas esta cotización y realizas el 50% de anticipo ($4,640 MXN)",
    "Nos envías: logo de tu empresa, colores corporativos, catálogo de productos y datos de contacto",
    "En 3 a 5 días hábiles tienes tu sistema listo y funcionando",
    "Entregamos el sistema con una sesión de capacitación de 30 minutos vía videollamada",
    "Soporte técnico incluido por 30 días posteriores a la entrega",
  ];
  return [
    sectionHeading("¿QUÉ PASA DESPUÉS DE CONTRATAR?"),
    ...steps.map((text) => new Paragraph({
      children: [r(text, { size: 20, color: "1A1A2E" })],
      numbering: { reference: "steps2", level: 0 },
      spacing: { after: 80 },
    })),
    spacer(140),
  ];
}

// ─── SECTION 9: TÉRMINOS ──────────────────────────────────────────────────
function makeTerminos() {
  const terms = [
    "- El sistema se entrega configurado con la información de tu empresa",
    "- El cliente es responsable de las cuentas de Telegram, Gmail y los servicios de IA (costo aproximado $10-30 USD/mes según volumen)",
    "- El anticipo del 50% confirma el pedido; el 50% restante se paga al momento de la entrega",
    "- El precio incluye una sola instalación y configuración",
    "- No incluye mantenimiento mensual (disponible por separado)",
    "- Vigencia de esta cotización: 30 días naturales",
    "- Precios expresados en pesos mexicanos (MXN) más IVA",
    "- Entrega vía instalación remota; capacitación por videollamada incluida",
  ];
  return [
    new Paragraph({
      children: [r("TÉRMINOS Y CONDICIONES", { bold: true, size: 20, color: "616161" })],
      spacing: { after: 100, before: 100 },
    }),
    ...terms.map((t) => new Paragraph({
      children: [r(t, { size: 18, color: "616161" })],
      spacing: { after: 60 },
    })),
    spacer(140),
  ];
}

// ─── SECTION 10: CONDITIONS + BANKING ─────────────────────────────────────
function makeCondBanking() {
  const leftChildren = [
    new Paragraph({
      children: [r("CONDICIONES DE PAGO", { bold: true, size: 18, color: "0066CC" })],
      spacing: { after: 80 },
    }),
    new Paragraph({ children: [r("- 50% de anticipo para iniciar", { size: 18, color: "1A1A2E" })], spacing: { after: 40 } }),
    new Paragraph({ children: [r("- 50% restante al finalizar", { size: 18, color: "1A1A2E" })], spacing: { after: 40 } }),
    new Paragraph({ children: [r("- Precios en MXN + IVA", { size: 18, color: "1A1A2E" })], spacing: { after: 40 } }),
    new Paragraph({ children: [r("- Entrega en 3 a 5 días hábiles", { size: 18, color: "1A1A2E" })], spacing: { after: 0 } }),
  ];

  const rightChildren = [
    new Paragraph({
      children: [r("DATOS BANCARIOS", { bold: true, size: 18, color: "0066CC" })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        r("Beneficiario: ", { bold: true, size: 18, color: "1A1A2E" }),
        r("Guadalupe Salinas Baños", { size: 18, color: "1A1A2E" }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        r("Banco: ", { bold: true, size: 18, color: "1A1A2E" }),
        r("MERCADO PAGO", { size: 18, color: "1A1A2E" }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        r("CLABE INTERBANCARIA: ", { bold: true, size: 18, color: "1A1A2E" }),
        r("7229 6901 0455 5450 66", { size: 18, color: "1A1A2E" }),
      ],
      spacing: { after: 0 },
    }),
  ];

  return [
    new Table({
      width: { size: 10080, type: WidthType.DXA },
      borders: noOuterBorders(),
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 4860, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: "EBF3FB" },
              borders: allCellBorders("B0C4DE"),
              margins: { top: 160, bottom: 160, left: 200, right: 200 },
              children: leftChildren,
            }),
            new TableCell({
              width: { size: 5220, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: "EBF3FB" },
              borders: allCellBorders("B0C4DE"),
              margins: { top: 160, bottom: 160, left: 200, right: 200 },
              children: rightChildren,
            }),
          ],
        }),
      ],
    }),
    spacer(100),
  ];
}

// ─── SECTION 11: VALIDITY BAR ─────────────────────────────────────────────
function makeValidityBar() {
  return new Table({
    width: { size: 10080, type: WidthType.DXA },
    borders: noOuterBorders(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10080, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "0066CC" },
            borders: { top: nb, bottom: nb, left: nb, right: nb },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            children: [
              new Paragraph({
                children: [r("Esta cotización tiene una vigencia de 30 días a partir de la fecha de emisión", { size: 18, color: "FFFFFF" })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ─── FOOTER ────────────────────────────────────────────────────────────────
function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          r(
            "Goodman Tech  |  Zuazua #114 Col. Centro, Monterrey N.L. CP 64000  |  Tel: 81 2635 0902  |  info@goodmantech.com.mx",
            { size: 16, color: "616161" }
          ),
        ],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "0066CC" } },
        spacing: { before: 60 },
      }),
    ],
  });
}

// ─── ASSEMBLE DOCUMENT ─────────────────────────────────────────────────────
async function main() {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "steps",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
        {
          reference: "steps2",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
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
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
          },
        },
        footers: { default: makeFooter() },
        children: [
          // SECTION 1: Header
          makeHeader(),
          // SEPARATOR
          separatorLine(),
          // SECTION 2: Intro box
          makeIntroBox(),
          spacer(140),
          // SECTION 3: Problema
          ...makeProblema(),
          // SECTION 4: Cómo funciona
          ...makeComoFunciona(),
          // SECTION 5: Incluye
          ...makeFeaturesTable(),
          // SECTION 6: Beneficios
          ...makeBeneficios(),
          // SECTION 7: Inversión
          ...makeInversion(),
          // SECTION 8: Post contrato
          ...makePostContrato(),
          // SECTION 9: Términos
          ...makeTerminos(),
          // SECTION 10: Cond + banking
          ...makeCondBanking(),
          // SECTION 11: Validity bar
          makeValidityBar(),
        ],
      },
    ],
  });

  const outPath = "C:\\Users\\Dell\\Documents\\CLAUDE DESKTOP\\Expo Cintermex\\Cotizacion_Sistema_Telegram.docx";
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`SUCCESS: Written to ${outPath}`);
  console.log(`File size: ${buffer.length} bytes`);
  console.log(`Logo embedded: ${logoEmbedded}`);
  console.log(`Folio: ${folio}`);
}

main().catch((e) => { console.error("ERROR:", e); process.exit(1); });
