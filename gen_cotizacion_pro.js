const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageNumber, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');
const path = require('path');

// ─── Colors ───────────────────────────────────────────────────────────────────
const BLUE = "1E50A0";
const ACCENT = "DC3C1E";
const WHITE = "FFFFFF";
const LIGHT_BLUE_BG = "D6E4F7";
const LIGHT_YELLOW_BG = "FFF9E6";
const GRAY_TEXT = "555555";
const DARK_TEXT = "1A1A1A";

// ─── Page measurements (US Letter, 1" margins, DXA) ───────────────────────────
const PAGE_WIDTH = 12240;
const PAGE_HEIGHT = 15840;
const MARGIN = 1080; // ~0.75 inch
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 10080

// ─── Helpers ──────────────────────────────────────────────────────────────────
function noBorder() {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: none, bottom: none, left: none, right: none };
}

function thinBorder(color = "CCCCCC") {
  const b = { style: BorderStyle.SINGLE, size: 4, color };
  return { top: b, bottom: b, left: b, right: b };
}

function spacer(pts = 6) {
  return new Paragraph({ spacing: { before: 0, after: 0, line: pts * 20 }, children: [new TextRun("")] });
}

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 4 } },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 26,
        color: BLUE,
        font: "Arial",
      }),
    ],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: DARK_TEXT })],
  });
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
const logoPath = path.join(__dirname, "assets", "goodman_logo.png");
const logoData = fs.readFileSync(logoPath);

// ─── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: 540, hanging: 260 } },
              run: { font: "Arial", color: BLUE },
            },
          },
        ],
      },
    ],
  },

  styles: {
    default: {
      document: { run: { font: "Arial", size: 22, color: DARK_TEXT } },
    },
  },

  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },

      // ── HEADER ───────────────────────────────────────────────────────────────
      headers: {
        default: new Header({
          children: [
            // Blue top bar
            new Paragraph({
              spacing: { before: 0, after: 100 },
              shading: { fill: BLUE, type: ShadingType.CLEAR },
              children: [new TextRun({ text: " ", size: 8 })],
            }),
            // Logo + company info side by side via table
            new Table({
              width: { size: CONTENT_WIDTH, type: WidthType.DXA },
              columnWidths: [2800, CONTENT_WIDTH - 2800],
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: WHITE },
                bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
                left: { style: BorderStyle.NONE, size: 0, color: WHITE },
                right: { style: BorderStyle.NONE, size: 0, color: WHITE },
                insideH: { style: BorderStyle.NONE, size: 0, color: WHITE },
                insideV: { style: BorderStyle.NONE, size: 0, color: WHITE },
              },
              rows: [
                new TableRow({
                  children: [
                    // Logo cell
                    new TableCell({
                      borders: noBorder(),
                      width: { size: 2800, type: WidthType.DXA },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.LEFT,
                          children: [
                            new ImageRun({
                              type: "png",
                              data: logoData,
                              transformation: { width: 160, height: 60 },
                              altText: { title: "Goodman Tech Logo", description: "Goodman Tech Logo", name: "GoodmanLogo" },
                            }),
                          ],
                        }),
                      ],
                    }),
                    // Company info cell
                    new TableCell({
                      borders: noBorder(),
                      width: { size: CONTENT_WIDTH - 2800, type: WidthType.DXA },
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 0, after: 20 },
                          children: [
                            new TextRun({ text: "Goodman Tech — Soluciones Tecnológicas", bold: true, size: 24, color: BLUE, font: "Arial" }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 0, after: 20 },
                          children: [
                            new TextRun({ text: "Zuazua #114 Col. Centro, Monterrey N.L. CP 64000", size: 18, color: GRAY_TEXT, font: "Arial" }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 0, after: 20 },
                          children: [
                            new TextRun({ text: "Tel: 81 2635 0902  |  info@goodmantech.com.mx", size: 18, color: GRAY_TEXT, font: "Arial" }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 0, after: 0 },
                          children: [
                            new TextRun({ text: "RFC: GMT0000000XXX", size: 18, color: GRAY_TEXT, font: "Arial" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            // Separator line
            new Paragraph({
              spacing: { before: 80, after: 0 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
              children: [new TextRun("")],
            }),
          ],
        }),
      },

      // ── FOOTER ───────────────────────────────────────────────────────────────
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              spacing: { before: 0, after: 0 },
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
              children: [new TextRun("")],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 40 },
              children: [
                new TextRun({ text: "Esta cotización tiene una vigencia de 30 días a partir de la fecha de emisión.", size: 18, color: GRAY_TEXT, font: "Arial" }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({ text: "Sistema desarrollado con IA — Goodman Tech  |  www.goodmantech.com.mx  |  81 2635 0902", size: 18, color: BLUE, font: "Arial", bold: true }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [
                new TextRun({ text: "Pág. ", size: 16, color: GRAY_TEXT, font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY_TEXT, font: "Arial" }),
              ],
            }),
          ],
        }),
      },

      // ── BODY ─────────────────────────────────────────────────────────────────
      children: [

        // ── Quotation Title Block ─────────────────────────────────────────────
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [CONTENT_WIDTH - 3200, 3200],
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: WHITE },
            bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
            left: { style: BorderStyle.NONE, size: 0, color: WHITE },
            right: { style: BorderStyle.NONE, size: 0, color: WHITE },
            insideH: { style: BorderStyle.NONE, size: 0, color: WHITE },
            insideV: { style: BorderStyle.NONE, size: 0, color: WHITE },
          },
          rows: [
            new TableRow({
              children: [
                // Left: main title
                new TableCell({
                  borders: noBorder(),
                  width: { size: CONTENT_WIDTH - 3200, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({ text: "COTIZACIÓN", bold: true, size: 52, color: BLUE, font: "Arial" }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 40, after: 0 },
                      children: [
                        new TextRun({ text: "Sistema Inteligente de Captura de Prospectos", size: 22, color: ACCENT, font: "Arial", bold: true }),
                      ],
                    }),
                  ],
                }),
                // Right: metadata box
                new TableCell({
                  borders: { top: thinBorder(BLUE).top, bottom: thinBorder(BLUE).bottom, left: thinBorder(BLUE).left, right: thinBorder(BLUE).right },
                  shading: { fill: LIGHT_BLUE_BG, type: ShadingType.CLEAR },
                  width: { size: 3200, type: WidthType.DXA },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 60 },
                      children: [
                        new TextRun({ text: "No. Cotización: ", bold: true, size: 19, color: BLUE, font: "Arial" }),
                        new TextRun({ text: "COT20260326001", size: 19, color: DARK_TEXT, font: "Arial" }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 0, after: 60 },
                      children: [
                        new TextRun({ text: "Fecha: ", bold: true, size: 19, color: BLUE, font: "Arial" }),
                        new TextRun({ text: "26/03/2026", size: 19, color: DARK_TEXT, font: "Arial" }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({ text: "Vigencia: ", bold: true, size: 19, color: BLUE, font: "Arial" }),
                        new TextRun({ text: "30 días", size: 19, color: DARK_TEXT, font: "Arial" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        spacer(10),

        // ── System Description ────────────────────────────────────────────────
        sectionTitle("Sistema Inteligente de Captura de Prospectos vía Telegram + IA"),

        spacer(4),

        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({
              text: "Automatización completa para exposiciones comerciales: captura de prospectos por audio o fotografía de tarjetas, análisis con Inteligencia Artificial, almacenamiento en base de datos en la nube, envío automático de correo al prospecto con resumen de la conversación y propuesta en PDF, y acceso a reportes desde Telegram.",
              size: 22,
              font: "Arial",
              color: DARK_TEXT,
            }),
          ],
        }),

        spacer(6),

        // ── What's Included ───────────────────────────────────────────────────
        sectionTitle("¿Qué incluye el sistema?"),

        spacer(4),

        bullet("Bot de Telegram personalizado con nombre y logo del cliente"),
        bullet("Captura por audio (transcripción IA) y foto de tarjeta de presentación"),
        bullet("Base de datos en la nube accesible desde cualquier dispositivo"),
        bullet("Exportación de prospectos a Excel/CSV con un comando"),
        bullet("Envío automático de correo profesional al prospecto"),
        bullet("Generación automática de PDF con resumen de conversación"),
        bullet("Panel de reportes: calidad de leads, prospectos del día, búsqueda"),
        bullet("Verificación inteligente de correo electrónico"),
        bullet("Detección automática de temperatura del lead (Frío / Tibio / Caliente)"),
        bullet("Configuración inicial y capacitación (máx. 15 minutos)"),

        spacer(10),

        // ── Pricing Section ───────────────────────────────────────────────────
        sectionTitle("Inversión — Tabla de Precios"),

        spacer(6),

        // Pricing Table
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [5500, 2200, 2380],
          rows: [
            // Header row
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  shading: { fill: BLUE, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  width: { size: 5500, type: WidthType.DXA },
                  borders: noBorder(),
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "PRODUCTO / SERVICIO", bold: true, size: 22, color: WHITE, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: BLUE, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  width: { size: 2200, type: WidthType.DXA },
                  borders: noBorder(),
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "PRECIO", bold: true, size: 22, color: WHITE, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: BLUE, type: ShadingType.CLEAR },
                  margins: { top: 120, bottom: 120, left: 160, right: 160 },
                  width: { size: 2380, type: WidthType.DXA },
                  borders: noBorder(),
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "FRECUENCIA", bold: true, size: 22, color: WHITE, font: "Arial" })],
                    }),
                  ],
                }),
              ],
            }),

            // Row 1 — Setup
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "EEF4FB", type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 5500, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Setup inicial", bold: true, size: 22, color: BLUE, font: "Arial" })],
                    }),
                    new Paragraph({
                      spacing: { before: 20, after: 0 },
                      children: [new TextRun({ text: "Configuración completa del sistema", size: 20, color: GRAY_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: "EEF4FB", type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 2200, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "$8,000 + IVA", bold: true, size: 22, color: ACCENT, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: "EEF4FB", type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 2380, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "Una sola vez", size: 20, color: DARK_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
              ],
            }),

            // Row 2 — Licencia evento
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: WHITE, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 5500, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Licencia por evento", bold: true, size: 22, color: BLUE, font: "Arial" })],
                    }),
                    new Paragraph({
                      spacing: { before: 20, after: 0 },
                      children: [new TextRun({ text: "Activación del bot para cada exposición", size: 20, color: GRAY_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: WHITE, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 2200, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "$1,500 + IVA", bold: true, size: 22, color: ACCENT, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: WHITE, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 2380, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "Por cada expo donde se use", size: 20, color: DARK_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
              ],
            }),

            // Row 3 — Soporte mensual
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "EEF4FB", type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 5500, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Soporte técnico mensual", bold: true, size: 22, color: BLUE, font: "Arial" })],
                    }),
                    new Paragraph({
                      spacing: { before: 20, after: 0 },
                      children: [new TextRun({ text: "Atención y mantenimiento del sistema", size: 20, color: GRAY_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: "EEF4FB", type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 2200, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "$500 + IVA", bold: true, size: 22, color: ACCENT, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: "EEF4FB", type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 2380, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "Opcional — mes a mes", size: 20, color: DARK_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
              ],
            }),

            // Row 4 — Módulo adicional
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: WHITE, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 5500, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Módulo adicional", bold: true, size: 22, color: BLUE, font: "Arial" })],
                    }),
                    new Paragraph({
                      spacing: { before: 20, after: 0 },
                      children: [new TextRun({ text: "WhatsApp / Multi-vendedor", size: 20, color: GRAY_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: WHITE, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 2200, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "$3,000 + IVA", bold: true, size: 22, color: ACCENT, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: WHITE, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 2380, type: WidthType.DXA },
                  borders: thinBorder("C5D8EF"),
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "A la carte", size: 20, color: DARK_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        spacer(8),

        // ── API Cost Note Box ─────────────────────────────────────────────────
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [CONTENT_WIDTH],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: LIGHT_BLUE_BG, type: ShadingType.CLEAR },
                  borders: { top: thinBorder(BLUE).top, bottom: thinBorder(BLUE).bottom, left: { style: BorderStyle.SINGLE, size: 16, color: ACCENT }, right: thinBorder(BLUE).right },
                  margins: { top: 120, bottom: 120, left: 200, right: 200 },
                  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 60 },
                      children: [
                        new TextRun({ text: "IMPORTANTE: ", bold: true, size: 22, color: ACCENT, font: "Arial" }),
                        new TextRun({
                          text: "Los costos de uso de las APIs de Inteligencia Artificial (Claude AI y OpenAI) NO están incluidos en esta cotización. Se facturan directamente por consumo según el volumen de prospectos procesados.",
                          size: 22, color: DARK_TEXT, font: "Arial",
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({ text: "Costo estimado: $0.01 - $0.05 USD por prospecto.", italic: true, size: 20, color: GRAY_TEXT, font: "Arial" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        spacer(8),

        // ── Business opportunity note ─────────────────────────────────────────
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [CONTENT_WIDTH],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: LIGHT_YELLOW_BG, type: ShadingType.CLEAR },
                  borders: { top: thinBorder("E8C000").top, bottom: thinBorder("E8C000").bottom, left: { style: BorderStyle.SINGLE, size: 16, color: "E8C000" }, right: thinBorder("E8C000").right },
                  margins: { top: 120, bottom: 120, left: 200, right: 200 },
                  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Con tan solo ", size: 22, color: DARK_TEXT, font: "Arial" }),
                        new TextRun({ text: "5 clientes recurrentes", bold: true, size: 22, color: BLUE, font: "Arial" }),
                        new TextRun({ text: " = ", size: 22, color: DARK_TEXT, font: "Arial" }),
                        new TextRun({ text: "$7,500 MXN/mes en licencias de evento", bold: true, size: 22, color: ACCENT, font: "Arial" }),
                        new TextRun({ text: ", sin desarrollar código adicional.", size: 22, color: DARK_TEXT, font: "Arial" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        spacer(12),

        // ── Payment Conditions ────────────────────────────────────────────────
        sectionTitle("Condiciones de Pago"),

        spacer(4),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [1400, CONTENT_WIDTH - 1400],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: BLUE, type: ShadingType.CLEAR },
                  borders: noBorder(),
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 1400, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "50%", bold: true, size: 36, color: WHITE, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: "EEF4FB", type: ShadingType.CLEAR },
                  borders: thinBorder("C5D8EF"),
                  margins: { top: 100, bottom: 100, left: 200, right: 160 },
                  width: { size: CONTENT_WIDTH - 1400, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Anticipo ", bold: true, size: 22, color: BLUE, font: "Arial" }),
                        new TextRun({ text: "— para iniciar el desarrollo del sistema", size: 22, color: DARK_TEXT, font: "Arial" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: ACCENT, type: ShadingType.CLEAR },
                  borders: noBorder(),
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  width: { size: 1400, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "50%", bold: true, size: 36, color: WHITE, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: WHITE, type: ShadingType.CLEAR },
                  borders: thinBorder("C5D8EF"),
                  margins: { top: 100, bottom: 100, left: 200, right: 160 },
                  width: { size: CONTENT_WIDTH - 1400, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Liquidación ", bold: true, size: 22, color: ACCENT, font: "Arial" }),
                        new TextRun({ text: "— al entregar el sistema completamente funcional", size: 22, color: DARK_TEXT, font: "Arial" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        spacer(6),

        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({ text: "Todos los precios son en pesos mexicanos (MXN) + IVA.", size: 20, color: GRAY_TEXT, font: "Arial", italic: true }),
          ],
        }),

        spacer(10),

        // ── Banking Info ──────────────────────────────────────────────────────
        sectionTitle("Datos Bancarios para Transferencia"),

        spacer(4),

        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [CONTENT_WIDTH],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "F0F4FA", type: ShadingType.CLEAR },
                  borders: thinBorder(BLUE),
                  margins: { top: 140, bottom: 140, left: 240, right: 240 },
                  width: { size: CONTENT_WIDTH, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      spacing: { before: 0, after: 80 },
                      children: [
                        new TextRun({ text: "Beneficiario: ", bold: true, size: 22, color: BLUE, font: "Arial" }),
                        new TextRun({ text: "Guadalupe Salinas Banos", size: 22, color: DARK_TEXT, font: "Arial" }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 0, after: 80 },
                      children: [
                        new TextRun({ text: "Banco: ", bold: true, size: 22, color: BLUE, font: "Arial" }),
                        new TextRun({ text: "MERCADO PAGO", size: 22, color: DARK_TEXT, font: "Arial" }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({ text: "CLABE Interbancaria: ", bold: true, size: 22, color: BLUE, font: "Arial" }),
                        new TextRun({ text: "7229 6901 0455 5450 66", size: 24, bold: true, color: DARK_TEXT, font: "Courier New" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        spacer(16),

        // ── Signature Area ────────────────────────────────────────────────────
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: [Math.floor(CONTENT_WIDTH / 2) - 200, 400, Math.floor(CONTENT_WIDTH / 2) - 200],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorder(),
                  width: { size: Math.floor(CONTENT_WIDTH / 2) - 200, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
                      spacing: { before: 60, after: 0 },
                      children: [new TextRun({ text: "Firma y sello del cliente", size: 18, color: GRAY_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: noBorder(),
                  width: { size: 400, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("")] })],
                }),
                new TableCell({
                  borders: noBorder(),
                  width: { size: Math.floor(CONTENT_WIDTH / 2) - 200, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
                      spacing: { before: 60, after: 0 },
                      children: [new TextRun({ text: "Firma Goodman Tech", size: 18, color: GRAY_TEXT, font: "Arial" })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

      ], // end children
    },
  ], // end sections
}); // end Document

// ─── Output ───────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "Cotizacion_Sistema_Telegram.docx");
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log("OK: Document written to", outPath);
}).catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
