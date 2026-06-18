/**
 * Hypothetical CareerCrafter Academy course catalog.
 * The skill-path generator recommends ONLY these courses so guidance stays
 * grounded in FuturePath's own learning content (per Caselet 2 RAG sources).
 */
export interface Course {
  title: string;
  skills: string[];
  weeks: number;
  level: "Foundational" | "Intermediate" | "Advanced";
}

export const COURSE_CATALOG: Course[] = [
  { title: "CareerCrafter Academy: JavaScript Foundations", skills: ["javascript", "js", "es6"], weeks: 3, level: "Foundational" },
  { title: "CareerCrafter Academy: Modern React in Practice", skills: ["react", "react.js", "hooks", "context api", "frontend"], weeks: 4, level: "Intermediate" },
  { title: "CareerCrafter Academy: TypeScript for Production Apps", skills: ["typescript", "ts"], weeks: 3, level: "Intermediate" },
  { title: "CareerCrafter Academy: Frontend Performance & Core Web Vitals", skills: ["performance", "core web vitals", "css", "html", "accessibility"], weeks: 2, level: "Advanced" },
  { title: "CareerCrafter Academy: Node.js & REST API Design", skills: ["node", "node.js", "api", "rest", "backend", "express"], weeks: 4, level: "Intermediate" },
  { title: "CareerCrafter Academy: Cloud Engineering on AWS", skills: ["aws", "ec2", "vpc", "cloudwatch", "ebs", "eks", "cloud"], weeks: 4, level: "Intermediate" },
  { title: "CareerCrafter Academy: Docker & Kubernetes Bootcamp", skills: ["docker", "kubernetes", "k8s", "containerization", "aks", "eks"], weeks: 4, level: "Intermediate" },
  { title: "CareerCrafter Academy: CI/CD with Jenkins & GitHub Actions", skills: ["ci/cd", "jenkins", "pipeline", "github actions", "groovy"], weeks: 3, level: "Intermediate" },
  { title: "CareerCrafter Academy: Infrastructure as Code with Terraform", skills: ["terraform", "infrastructure", "iac", "azure devops"], weeks: 3, level: "Advanced" },
  { title: "CareerCrafter Academy: Git & Collaborative Workflows", skills: ["git", "version control"], weeks: 1, level: "Foundational" },
  { title: "CareerCrafter Academy: Python for Engineers", skills: ["python"], weeks: 4, level: "Foundational" },
  { title: "CareerCrafter Academy: SQL & Data Modeling", skills: ["sql", "postgresql", "data modeling", "database"], weeks: 3, level: "Intermediate" },
  { title: "CareerCrafter Academy: Data Engineering with Spark & Airflow", skills: ["spark", "airflow", "etl", "data engineering"], weeks: 4, level: "Advanced" },
  { title: "CareerCrafter Academy: Machine Learning in Production", skills: ["machine learning", "ml", "pytorch", "mlops", "model deployment"], weeks: 6, level: "Advanced" },
  { title: "CareerCrafter Academy: LLMs, RAG & Applied GenAI", skills: ["llm", "rag", "nlp", "genai", "prompting"], weeks: 4, level: "Advanced" },
  { title: "CareerCrafter Academy: System Design Interview Intensive", skills: ["system design", "distributed systems", "scalability", "architecture"], weeks: 3, level: "Advanced" },
  { title: "CareerCrafter Academy: DevOps & Platform Engineering", skills: ["devops", "platform", "linux", "monitoring", "observability"], weeks: 4, level: "Intermediate" },
  { title: "CareerCrafter Academy: Interview Mastery & Storytelling", skills: ["interview", "behavioral", "communication"], weeks: 2, level: "Foundational" },
];

const GENERAL_FALLBACK = [
  "CareerCrafter Academy: System Design Interview Intensive",
  "CareerCrafter Academy: Interview Mastery & Storytelling",
];

/** Pick catalog courses that cover the given skills, ranked by overlap. */
export function coursesForSkills(skills: string[], limit = 5): Course[] {
  const wanted = skills.map((s) => s.toLowerCase().trim()).filter(Boolean);

  const scored = COURSE_CATALOG.map((course) => {
    const matches = course.skills.filter((cs) =>
      wanted.some((w) => w.includes(cs) || cs.includes(w))
    ).length;
    return { course, matches };
  }).filter((entry) => entry.matches > 0);

  scored.sort((a, b) => b.matches - a.matches);

  const picked = scored.slice(0, limit).map((entry) => entry.course);

  if (picked.length === 0) {
    return COURSE_CATALOG.filter((c) => GENERAL_FALLBACK.includes(c.title));
  }
  return picked;
}
