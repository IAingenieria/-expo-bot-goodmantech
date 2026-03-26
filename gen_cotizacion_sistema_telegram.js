'use strict';

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, LevelFormat, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Colour palette ──────────────────────────────────────────────────────────
const BLUE       = "1565C0";   // single standard blue for ALL blue elements
const WHITE      = "FFFFFF";
const LIGHT_BLUE = "E3F0FF";   // very light tint for note box background
const GRAY_LIGHT = "F5F5F5";
const GRAY_BORDER= "CCCCCC";
const BLACK      = "000000";

// ── Helpers ─────────────────────────────────────────────────────────────────
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: GRAY_BORDER };
const thinBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

const blueBorder = { style: BorderStyle.SINGLE, size: 4, color: BLUE };
const blueBorders = { top: blueBorder, bottom: blueBorder, left: blueBorder, right: blueBorder };

function blueCell(text, colW, opts = {}) {
  return new TableCell({
    borders: blueBorders,
    width: { size: colW, type: WidthType.DXA },
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 150, right: 150 },
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({
        text,
        bold: true,
        color: WHITE,
        font: "Arial",
        size: opts.size || 22,
      })]
    })]
  });
}

function bodyCell(text, colW, opts = {}) {
  return new TableCell({
    borders: thinBorders,
    width: { size: colW, type: WidthType.DXA },
    shading: { fill: opts.fill || WHITE, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({
        text,
        bold: opts.bold || false,
        color: opts.color || BLACK,
        font: "Arial",
        size: opts.size || 20,
      })]
    })]
  });
}

// ── Paths ────────────────────────────────────────────────────────────────────
const LOGO_PATH   = path.join(__dirname, 'assets', 'goodman_logo.png');
const OUTPUT_PATH = path.join(__dirname, 'Cotizacion_Sistema_Telegram.docx');

const logoData = fs.readFileSync(LOGO_PATH);

// ── Page dimensions (US Letter, 1" margins) ──────────────────────────────────
// Content width = 12240 - 1440 - 1440 = 9360 DXA
const CONTENT_W = 9360;

// ── HEADER ───────────────────────────────────────────────────────────────────
// Logo left, company info right — using a single-row table with no borders
const headerTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [1800, 7560],
  rows: [
    new TableRow({
      children: [
        // Logo cell
        new TableCell({
          borders: noBorders,
          width: { size: 1800, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 0, bottom: 0, left: 0, right: 120 },
          children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new ImageRun({
              type: "png",
              data: logoData,
              transformation: { width: 80, height: 60 },
              altText: { title: "Goodman Tech Logo", description: "Goodman Tech bird logo", name: "GoodmanLogo" }
            })]
          })]
        }),
        // Company info cell
        new TableCell({
          borders: noBorders,
          width: { size: 7560, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 0, bottom: 0, left: 120, right: 0 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Goodman Tech — Soluciones Tecnológicas", bold: true, font: "Arial", size: 24, color: BLUE })]
            }),
            new Paragraph({
              children: [new TextRun({ text: "Zuazua #114 Col. Centro, Monterrey N.L. CP 64000", font: "Arial", size: 18, color: "444444" })]
            }),
            new Paragraph({
              children: [new TextRun({ text: "RFC: GMT000000XXX  |  Tel: 81 2635 0902  |  info@goodmantech.com.mx", font: "Arial", size: 18, color: "444444" })]
            }),
          ]
        }),
      ]
    })
  ]
});

// Blue separator line after header
const blueLine = new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 1 } },
  spacing: { after: 0 },
  children: [new TextRun({ text: "" })]
});

// ── COTIZACION TITLE BLOCK ────────────────────────────────────────────────────
const titleTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [6560, 2800],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders: noBorders,
          width: { size: 6560, type: WidthType.DXA },
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          margins: { top: 160, bottom: 160, left: 200, right: 200 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: "COTIZACIÓN", bold: true, font: "Arial", size: 40, color: WHITE })]
            }),
            new Paragraph({
              children: [new TextRun({ text: "Sistema de Captura de Prospectos vía Telegram", font: "Arial", size: 22, color: WHITE })]
            }),
          ]
        }),
        new TableCell({
          borders: noBorders,
          width: { size: 2800, type: WidthType.DXA },
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "No. COT-2026-EXPO-001", font: "Arial", size: 18, color: WHITE })]
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Fecha: 26 de marzo de 2026", font: "Arial", size: 18, color: WHITE })]
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "Vigencia: 30 días", font: "Arial", size: 18, color: WHITE })]
            }),
          ]
        }),
      ]
    })
  ]
});

// ── SYSTEM DESCRIPTION ────────────────────────────────────────────────────────
function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 280, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 24, color: BLUE })]
  });
}

const descPara = new Paragraph({
  spacing: { before: 120, after: 200 },
  children: [new TextRun({
    text: "Sistema automatizado que integra un bot de Telegram con inteligencia artificial para capturar, calificar y gestionar prospectos en tiempo real durante exposiciones y ferias industriales. El sistema conecta directamente con tu CRM y envía propuestas comerciales personalizadas por correo electrónico de forma automática.",
    font: "Arial",
    size: 20,
    color: "333333"
  })]
});

// ── BENEFITS LIST ─────────────────────────────────────────────────────────────
const benefits = [
  "Bot de Telegram con flujo conversacional inteligente",
  "Captura automática de datos: nombre, empresa, necesidades del prospecto",
  "Procesamiento de mensajes de voz con transcripción por IA (Whisper)",
  "Análisis y calificación del prospecto con Claude AI",
  "Generación automática de propuesta comercial personalizada en PDF",
  "Envío de propuesta por correo electrónico en tiempo real",
  "Registro automático del prospecto en CRM (Baserow)",
  "Panel web de seguimiento con historial de conversaciones",
  "Soporte multiidioma (Español/Inglés)",
  "Configuración personalizada con logo y datos de tu empresa",
];

const benefitItems = benefits.map(b =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text: b, font: "Arial", size: 20, color: "333333" })]
  })
);

// ── PRICING TABLE ─────────────────────────────────────────────────────────────
// Columns: Concepto (3700), Precio (2000), Periodicidad (2660) + small internal
// Total: 3700 + 300 + 2000 + 300 + 2760 = adjusted to 9360
// Actually: 4200 + 2580 + 2580 = 9360
const C1 = 4560, C2 = 2400, C3 = 2400;

const pricingRows = [
  { concepto: "Setup inicial (implementación y configuración completa)", precio: "$8,000 + IVA", periodo: "Una sola vez" },
  { concepto: "Licencia por evento", precio: "$1,500 + IVA", periodo: "Por cada expo donde se use" },
  { concepto: "Soporte técnico mensual", precio: "$500 + IVA", periodo: "Opcional" },
  { concepto: "Módulo adicional (WhatsApp / Multi-vendedor)", precio: "$3,000 + IVA", periodo: "À la carte" },
];

const pricingTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [C1, C2, C3],
  rows: [
    // Header row
    new TableRow({
      children: [
        blueCell("Concepto / Servicio", C1),
        blueCell("Precio", C2, { align: AlignmentType.CENTER }),
        blueCell("Periodicidad", C3, { align: AlignmentType.CENTER }),
      ]
    }),
    // Data rows
    ...pricingRows.map((row, i) =>
      new TableRow({
        children: [
          bodyCell(row.concepto, C1, { fill: i % 2 === 0 ? WHITE : GRAY_LIGHT }),
          bodyCell(row.precio, C2, { align: AlignmentType.CENTER, bold: true, fill: i % 2 === 0 ? WHITE : GRAY_LIGHT }),
          bodyCell(row.periodo, C3, { align: AlignmentType.CENTER, fill: i % 2 === 0 ? WHITE : GRAY_LIGHT }),
        ]
      })
    )
  ]
});

// ── API COST WARNING NOTE BOX ─────────────────────────────────────────────────
const noteBox = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [CONTENT_W],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders: blueBorders,
          width: { size: CONTENT_W, type: WidthType.DXA },
          shading: { fill: LIGHT_BLUE, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: "⚠ Nota sobre costos de APIs de IA", bold: true, font: "Arial", size: 20, color: BLUE })]
            }),
            new Paragraph({
              children: [new TextRun({
                text: "Los precios anteriores NO incluyen el costo de las APIs externas de inteligencia artificial (OpenAI Whisper para transcripción de voz y Anthropic Claude para análisis de prospectos). Estos servicios se contratan directamente con cada proveedor y se facturan por uso. El costo estimado por evento de 3 días es de $200–$500 MXN dependiendo del volumen de interacciones.",
                font: "Arial", size: 20, color: "333333"
              })]
            }),
          ]
        })
      ]
    })
  ]
});

// ── ROI NOTE ────────────────────────────────────────────────────────────────
const roiPara = new Paragraph({
  spacing: { before: 200, after: 120 },
  children: [
    new TextRun({ text: "Proyección de recuperación: ", bold: true, font: "Arial", size: 20, color: BLUE }),
    new TextRun({ text: "Con solo 5 clientes activos usando el sistema en expos recurrentes, el ingreso mensual por licencias es de ", font: "Arial", size: 20, color: "333333" }),
    new TextRun({ text: "$7,500 MXN/mes", bold: true, font: "Arial", size: 20, color: BLUE }),
    new TextRun({ text: " — lo que cubre el setup inicial en menos de 2 meses.", font: "Arial", size: 20, color: "333333" }),
  ]
});

// ── PAYMENT CONDITIONS ────────────────────────────────────────────────────────
const paymentPara = new Paragraph({
  spacing: { before: 120, after: 120 },
  children: [new TextRun({
    text: "Condiciones de pago: 50% de anticipo al confirmar el proyecto — 50% al entregar el sistema funcional. Tiempo de entrega estimado: 3 a 5 días hábiles. Incluye 30 días de soporte técnico sin costo adicional.",
    font: "Arial", size: 20, color: "333333"
  })]
});

// ── BANKING INFO ──────────────────────────────────────────────────────────────
const bankTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [CONTENT_W],
  rows: [
    new TableRow({
      children: [
        new TableCell({
          borders: thinBorders,
          width: { size: CONTENT_W, type: WidthType.DXA },
          shading: { fill: GRAY_LIGHT, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: "Datos bancarios para transferencia", bold: true, font: "Arial", size: 20, color: BLUE })]
            }),
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: "Beneficiario: Guadalupe Salinas Baños", font: "Arial", size: 20, color: "333333" })]
            }),
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: "Banco: MERCADO PAGO", font: "Arial", size: 20, color: "333333" })]
            }),
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: "CLABE interbancaria: 7229 6901 0455 5450 66", bold: true, font: "Arial", size: 20, color: "333333" })]
            }),
          ]
        })
      ]
    })
  ]
});

// ── FOOTER ────────────────────────────────────────────────────────────────────
const docFooter = new Footer({
  children: [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
      spacing: { before: 60 },
      children: [
        new TextRun({ text: "Esta cotización tiene vigencia de 30 días a partir de su fecha de emisión.  ", font: "Arial", size: 16, color: "555555" }),
        new TextRun({ text: "Goodman Tech — Soluciones Tecnológicas  |  info@goodmantech.com.mx  |  81 2635 0902", font: "Arial", size: 16, color: BLUE }),
        new TextRun("  "),
        new TextRun({ children: ["Página ", PageNumber.CURRENT, " de ", PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: "555555" }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }]
    })
  ]
});

// ── DOCUMENT ──────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    headers: {
      default: new Header({ children: [headerTable, blueLine] })
    },
    footers: {
      default: docFooter
    },
    children: [
      // Spacing after header
      new Paragraph({ spacing: { before: 0, after: 160 }, children: [new TextRun("")] }),

      // Title block
      titleTable,

      // Description
      new Paragraph({ spacing: { before: 0, after: 0 }, children: [new TextRun("")] }),
      sectionTitle("Descripción del Sistema"),
      descPara,

      // Benefits
      sectionTitle("¿Qué incluye?"),
      new Paragraph({ spacing: { before: 80, after: 0 }, children: [new TextRun("")] }),
      ...benefitItems,

      // Pricing
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),
      sectionTitle("Tabla de Precios"),
      new Paragraph({ spacing: { before: 120, after: 0 }, children: [new TextRun("")] }),
      pricingTable,

      // API note
      new Paragraph({ spacing: { before: 200, after: 0 }, children: [new TextRun("")] }),
      noteBox,

      // ROI note
      roiPara,

      // Payment conditions
      sectionTitle("Condiciones de Pago y Entrega"),
      paymentPara,

      // Banking info
      new Paragraph({ spacing: { before: 120, after: 0 }, children: [new TextRun("")] }),
      bankTable,

      // Closing
      new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: "Para aceptar esta cotización o resolver cualquier duda, contáctenos:", font: "Arial", size: 20, color: "333333" })] }),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: "info@goodmantech.com.mx  |  81 2635 0902  |  Monterrey, N.L.", bold: true, font: "Arial", size: 22, color: BLUE })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log("SUCCESS: Document saved to", OUTPUT_PATH);
  console.log("File size:", fs.statSync(OUTPUT_PATH).size, "bytes");
}).catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
