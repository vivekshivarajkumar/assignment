import * as cheerio from "cheerio";

export interface ParsedJobPage {
  title: string;
  company: string;
  description: string;
  requirements: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
}

export async function fetchJobFromUrl(url: string): Promise<ParsedJobPage> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ResumeMatchBot/1.0; +https://github.com/resume-match)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch job URL (${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header").remove();

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Unknown Role";

  const company =
    $('meta[property="og:site_name"]').attr("content") ||
    extractCompanyFromTitle(title) ||
    extractCompanyFromUrl(url) ||
    "Unknown Company";

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    extractMainText($) ||
    "No description available.";

  const fullText = $("body").text().replace(/\s+/g, " ").trim();
  const requirements = extractRequirements(fullText);
  const location = extractLocation(fullText);
  const { min, max } = extractSalary(fullText);

  return {
    title: cleanTitle(title),
    company,
    description: description.slice(0, 5000),
    requirements,
    location,
    salaryMin: min,
    salaryMax: max,
  };
}

function extractMainText($: cheerio.CheerioAPI): string {
  const selectors = [
    '[class*="description"]',
    '[class*="job-detail"]',
    '[id*="description"]',
    "article",
    "main",
  ];
  for (const sel of selectors) {
    const text = $(sel).first().text().replace(/\s+/g, " ").trim();
    if (text.length > 200) return text.slice(0, 5000);
  }
  return $("body").text().replace(/\s+/g, " ").slice(0, 5000);
}

function extractRequirements(text: string): string {
  const patterns = [
    /requirements?[:\s]+([\s\S]{50,800}?)(?:benefits|about|qualifications|$)/i,
    /qualifications?[:\s]+([\s\S]{50,800}?)(?:benefits|about|$)/i,
    /what you'll bring[:\s]+([\s\S]{50,800}?)(?:benefits|about|$)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().slice(0, 1500);
  }
  return "";
}

function extractLocation(text: string): string {
  const m = text.match(
    /(?:location|based in|office)[:\s]+([A-Za-z0-9\s,]+(?:Remote|Hybrid|On-site)?)/i
  );
  return m ? m[1].trim().slice(0, 100) : "";
}

function extractSalary(text: string): { min: number | null; max: number | null } {
  const range = text.match(
    /\$\s*([\d,]+)k?\s*[-–—to]+\s*\$?\s*([\d,]+)k?/i
  );
  if (range) {
    return {
      min: parseSalaryNum(range[1]),
      max: parseSalaryNum(range[2]),
    };
  }
  const single = text.match(/(?:salary|compensation)[:\s]+\$?\s*([\d,]+)k?/i);
  if (single) {
    const n = parseSalaryNum(single[1]);
    return { min: n, max: n };
  }
  return { min: null, max: null };
}

function parseSalaryNum(s: string): number {
  const n = parseInt(s.replace(/,/g, ""), 10);
  return n < 1000 ? n * 1000 : n;
}

function extractCompanyFromTitle(title: string): string | null {
  const at = title.match(/at\s+(.+?)(?:\s*[|\-–]|$)/i);
  if (at) return at[1].trim();
  const pipe = title.split("|");
  if (pipe.length > 1) return pipe[pipe.length - 1].trim();
  return null;
}

function extractCompanyFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    const name = host.split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "Unknown Company";
  }
}

function cleanTitle(title: string): string {
  return title.split("|")[0].split(" - ")[0].trim().slice(0, 200);
}

export function validateJobUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("URL must use http or https");
  }
  return parsed.toString();
}
