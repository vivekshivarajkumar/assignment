import { normalizeTailoredContent } from "./resume-markdown";

interface Segment {
  text: string;
  bold: boolean;
}

function parseInline(text: string): Segment[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false }
    );
}

/** Render markdown-ish resume content into a downloadable, text-selectable PDF. */
export async function downloadResumePdf(
  content: string,
  filename: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  const lineGap = 4;
  let y = margin + 8;

  function ensureSpace(h: number): void {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin + 8;
    }
  }

  function writeBlock(
    segments: Segment[],
    opts: {
      size: number;
      indent?: number;
      baseBold?: boolean;
      color?: [number, number, number];
      gapBefore?: number;
    }
  ): void {
    const indent = opts.indent ?? 0;
    const startX = margin + indent;
    const lineH = opts.size + lineGap;
    const [r, g, b] = opts.color ?? [55, 58, 66];

    if (opts.gapBefore) y += opts.gapBefore;

    doc.setFontSize(opts.size);
    doc.setTextColor(r, g, b);

    const words: Segment[] = [];
    for (const seg of segments) {
      for (const w of seg.text.split(/\s+/)) {
        if (w) words.push({ text: w, bold: seg.bold || !!opts.baseBold });
      }
    }

    ensureSpace(lineH);
    let x = startX;
    words.forEach((word, idx) => {
      doc.setFont("helvetica", word.bold ? "bold" : "normal");
      const wordW = doc.getTextWidth(word.text);
      const spaceW = idx > 0 ? doc.getTextWidth(" ") : 0;
      if (x + spaceW + wordW > margin + maxW) {
        y += lineH;
        ensureSpace(lineH);
        x = startX;
      } else {
        x += spaceW;
      }
      doc.text(word.text, x, y);
      x += wordW;
    });
    y += lineH;
  }

  const lines = normalizeTailoredContent(content).split("\n");

  for (const raw of lines) {
    const t = raw.trim();

    if (!t) {
      y += 7;
      continue;
    }

    if (t === "---" || t === "***") {
      ensureSpace(16);
      y += 6;
      doc.setDrawColor(224, 226, 234);
      doc.line(margin, y, margin + maxW, y);
      y += 10;
      continue;
    }

    if (t.startsWith("### ")) {
      writeBlock(parseInline(t.slice(4)), {
        size: 10.5,
        baseBold: true,
        color: [20, 20, 28],
        gapBefore: 8,
      });
      continue;
    }
    if (t.startsWith("## ")) {
      writeBlock(parseInline(t.slice(3)), {
        size: 13,
        baseBold: true,
        color: [12, 12, 18],
        gapBefore: 10,
      });
      continue;
    }
    if (t.startsWith("# ")) {
      writeBlock(parseInline(t.slice(2)), {
        size: 17,
        baseBold: true,
        color: [8, 8, 12],
        gapBefore: 6,
      });
      continue;
    }

    if (t.startsWith("- ") || t.startsWith("* ")) {
      ensureSpace(10.5 + lineGap);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(108, 92, 231);
      doc.text("•", margin + 6, y);
      writeBlock(parseInline(t.slice(2)), { size: 10.5, indent: 20 });
      continue;
    }

    writeBlock(parseInline(t), { size: 10.5, color: [70, 73, 82] });
  }

  doc.save(filename);
}
