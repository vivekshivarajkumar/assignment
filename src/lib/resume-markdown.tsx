import type React from "react";

export function normalizeTailoredContent(content: string): string {
  return content
    .trim()
    .replace(/^```(?:markdown|md)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-uber-black">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function resumeMarkdownToElements(content: string): React.ReactNode[] {
  const lines = normalizeTailoredContent(content).split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={index} className="h-2" />);
      return;
    }

    if (trimmed === "---" || trimmed === "***") {
      elements.push(<hr key={index} className="my-4 border-uber-gray-200" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={index}
          className="mt-4 text-sm font-semibold uppercase tracking-wide text-uber-black"
        >
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={index} className="mt-5 text-base font-semibold text-uber-black">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={index} className="text-lg font-bold text-uber-black">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <li
          key={index}
          className="ml-4 list-disc text-sm leading-relaxed text-uber-gray-600"
        >
          {renderInline(trimmed.slice(2))}
        </li>
      );
      return;
    }

    elements.push(
      <p key={index} className="text-sm leading-relaxed text-uber-gray-600">
        {renderInline(trimmed)}
      </p>
    );
  });

  return elements;
}
