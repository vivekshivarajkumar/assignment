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
      elements.push(<div key={index} className="h-1.5" />);
      return;
    }

    if (trimmed === "---" || trimmed === "***") {
      elements.push(<hr key={index} className="my-3 border-uber-gray-200" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={index}
          className="mt-3 text-[13px] font-semibold text-uber-black"
        >
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={index}
          className="mt-5 border-b border-uber-gray-200 pb-1 text-[13px] font-bold uppercase text-uber-black"
        >
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2
          key={index}
          className="text-center text-xl font-bold leading-tight text-uber-black"
        >
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <li
          key={index}
          className="ml-5 list-disc text-[13px] leading-6 text-uber-gray-700"
        >
          {renderInline(trimmed.slice(2))}
        </li>
      );
      return;
    }

    elements.push(
      <p
        key={index}
        className={`text-[13px] leading-6 text-uber-gray-700 ${
          index <= 2 ? "text-center" : ""
        }`}
      >
        {renderInline(trimmed)}
      </p>
    );
  });

  return elements;
}
