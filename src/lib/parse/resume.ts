export async function parseResumeFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text.trim();
    } catch (err) {
      console.warn("PDF parse failed:", err);
      throw new Error(
        "Could not parse PDF. Try uploading a .txt file or paste your resume as text."
      );
    }
  }

  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8").trim();
  }

  const text = buffer.toString("utf-8").trim();
  if (text.length > 50) return text;

  throw new Error("Unsupported file type. Upload PDF or TXT.");
}

export async function parseResumeText(text: string): Promise<string> {
  const trimmed = text.trim();
  if (trimmed.length < 50) {
    throw new Error("Resume text is too short. Please provide more content.");
  }
  return trimmed;
}
