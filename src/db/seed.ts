import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import type { getDb } from "./index";
import { embedText, serializeEmbedding } from "@/lib/rag/embeddings";

/** Fixed id so this demo job can be upserted on existing databases */
export const DEMO_MATCH_JOB_ID = "demo-mrutunjay-frontend-devops";

const DEMO_STRUCTURED_PROFILE = {
  title: "Frontend / DevOps Engineer",
  company: "Razorpay",
  seniority: "mid",
  domain: "fintech",
  responsibilities: [
    "Build fintech frontends with React.js and JavaScript",
    "Integrate REST APIs with frontend applications",
    "Automate frontend deployments across environments",
    "Create Jenkins CI/CD pipelines with Docker and Kubernetes",
    "Deploy applications to AWS EKS or Azure AKS",
    "Use Terraform for infrastructure and Azure DevOps for releases",
  ],
  mustHaveSkills: [
    "javascript",
    "react",
    "html",
    "git",
    "aws",
    "jenkins",
    "docker",
    "kubernetes",
    "terraform",
    "api",
  ],
  niceToHaveSkills: [
    "sonarqube",
    "azure",
    "ci/cd",
    "fintech",
    "netlify",
    "ec2",
  ],
  tools: [
    "jenkins",
    "docker",
    "kubernetes",
    "terraform",
    "aws",
    "react",
    "javascript",
  ],
  keywords: [
    "frontend",
    "devops",
    "react js",
    "fintech",
    "ci/cd",
    "pipeline",
    "containerization",
    "azure devops",
  ],
  location: "Bangalore, India (Hybrid)",
  extractionConfidence: 98,
};

export const MRUTUNJAY_DEMO_JOB = {
  id: DEMO_MATCH_JOB_ID,
  title: "Frontend / DevOps Engineer",
  company: "Razorpay",
  description: `We are hiring a Frontend / DevOps Engineer to build fintech products used by millions across India.

Frontend (React.js):
- Create frontends with React Js, JavaScript, and HTML using functional components and Context API
- Integrate REST APIs with frontend applications
- Work with Git for version control
- Automate frontend applications and deploy them into different environments (including Netlify-style workflows)
- Ecommerce and fintech UI experience is a plus

DevOps & Platform:
- Create CI/CD pipelines on Jenkins (including Groovy scripts)
- Build Docker images and push to Docker Hub; containerization with Docker
- Deploy applications into Kubernetes (self-managed on AKS/EKS)
- Work with Terraform for cloud-agnostic infrastructure
- Azure DevOps (ADO) for release management
- AWS services: EC2, VPC, EBS, CloudWatch
- Sonarqube for code quality in the pipeline

You have hands-on experience from fintech or consulting (BharatPe, PWC, KPI Ninja-style environments) and personal projects using React (ecommerce, Kanban board). B.Tech in Computer Science preferred.`,
  requirements: `Must have: JavaScript, React Js, HTML, Git, AWS, Jenkins, Docker, Kubernetes, Terraform, API integration, CI/CD pipelines
Nice to have: Sonarqube, Azure DevOps, EC2, VPC, CloudWatch, fintech, functional components, Context API, Netlify`,
  location: "Bangalore, India (Hybrid)",
  salaryMin: 140000,
  salaryMax: 220000,
  structuredProfile: DEMO_STRUCTURED_PROFILE,
};

const SAMPLE_JOBS = [
  MRUTUNJAY_DEMO_JOB,
  {
    title: "Senior Full Stack Engineer",
    company: "Stripe",
    description:
      "Build payment infrastructure at scale. Work with React, Node.js, TypeScript, and distributed systems. Lead feature development and mentor junior engineers.",
    requirements:
      "5+ years experience, React, Node.js, TypeScript, SQL, system design, AWS",
    location: "San Francisco, CA (Remote)",
    salaryMin: 180000,
    salaryMax: 250000,
  },
  {
    title: "Machine Learning Engineer",
    company: "OpenAI",
    description:
      "Develop and deploy ML models for production. Work with PyTorch, Python, LLMs, and RAG pipelines. Optimize inference and training workflows.",
    requirements:
      "MS/PhD preferred, Python, PyTorch, NLP, distributed training, MLOps",
    location: "San Francisco, CA",
    salaryMin: 200000,
    salaryMax: 350000,
  },
  {
    title: "Frontend Developer",
    company: "Vercel",
    description:
      "Build developer-facing UI with Next.js and React. Focus on performance, accessibility, and design systems. Collaborate with product and design teams.",
    requirements:
      "3+ years React/Next.js, TypeScript, CSS, performance optimization, testing",
    location: "Remote",
    salaryMin: 140000,
    salaryMax: 190000,
  },
  {
    title: "Backend Engineer",
    company: "Datadog",
    description:
      "Design high-throughput data pipelines and APIs. Go, Python, Kafka, PostgreSQL. Build observability features used by thousands of customers.",
    requirements:
      "4+ years backend, Go or Python, distributed systems, SQL, Kubernetes",
    location: "New York, NY",
    salaryMin: 160000,
    salaryMax: 220000,
  },
  {
    title: "DevOps / Platform Engineer",
    company: "HashiCorp",
    description:
      "Manage cloud infrastructure and CI/CD pipelines. Terraform, Kubernetes, AWS/GCP. Enable teams to ship reliably and securely.",
    requirements:
      "Terraform, Kubernetes, AWS, CI/CD, Linux, scripting (Python/Bash)",
    location: "Austin, TX (Hybrid)",
    salaryMin: 150000,
    salaryMax: 200000,
  },
  {
    title: "Data Engineer",
    company: "Snowflake",
    description:
      "Build ETL pipelines and data warehouses. Spark, SQL, Python, Airflow. Enable analytics and ML teams with clean, reliable data.",
    requirements:
      "SQL, Python, Spark, Airflow, data modeling, cloud data platforms",
    location: "Remote",
    salaryMin: 155000,
    salaryMax: 210000,
  },
  {
    title: "Product Manager - AI",
    company: "Notion",
    description:
      "Define AI-powered product features. Work with engineering on LLM integrations, user research, and roadmap prioritization.",
    requirements:
      "3+ years PM, AI/ML product experience, user research, technical background",
    location: "San Francisco, CA",
    salaryMin: 170000,
    salaryMax: 230000,
  },
  {
    title: "Junior Software Engineer",
    company: "Shopify",
    description:
      "Entry-level role building e-commerce features. Ruby on Rails, React, pair programming, and mentorship from senior engineers.",
    requirements:
      "CS degree or bootcamp, JavaScript, basic SQL, eager to learn, Git",
    location: "Remote (US/Canada)",
    salaryMin: 90000,
    salaryMax: 120000,
  },
];

async function insertJob(
  db: ReturnType<typeof getDb>,
  job: (typeof SAMPLE_JOBS)[number]
) {
  const jobText = `${job.title} ${job.description} ${job.requirements ?? ""}`;
  const embedding = await embedText(jobText);
  const structuredProfile =
    "structuredProfile" in job && job.structuredProfile
      ? JSON.stringify(job.structuredProfile)
      : null;

  await db.insert(schema.jobs).values({
    id: "id" in job && job.id ? job.id : uuidv4(),
    title: job.title,
    company: job.company,
    description: job.description,
    requirements: job.requirements,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    source: "seed",
    structuredProfile,
    embedding: serializeEmbedding(embedding),
    createdAt: new Date(),
  });
}

export async function ensureDemoMatchJob(
  db: ReturnType<typeof getDb>
): Promise<void> {
  const jobText = `${MRUTUNJAY_DEMO_JOB.title} ${MRUTUNJAY_DEMO_JOB.description} ${MRUTUNJAY_DEMO_JOB.requirements}`;
  const embedding = await embedText(jobText);
  const structuredProfile = JSON.stringify(MRUTUNJAY_DEMO_JOB.structuredProfile);

  const [existing] = await db
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.id, DEMO_MATCH_JOB_ID))
    .limit(1);

  if (existing) {
    await db
      .update(schema.jobs)
      .set({
        title: MRUTUNJAY_DEMO_JOB.title,
        company: MRUTUNJAY_DEMO_JOB.company,
        description: MRUTUNJAY_DEMO_JOB.description,
        requirements: MRUTUNJAY_DEMO_JOB.requirements,
        location: MRUTUNJAY_DEMO_JOB.location,
        salaryMin: MRUTUNJAY_DEMO_JOB.salaryMin,
        salaryMax: MRUTUNJAY_DEMO_JOB.salaryMax,
        structuredProfile,
        embedding: serializeEmbedding(embedding),
      })
      .where(eq(schema.jobs.id, DEMO_MATCH_JOB_ID));
    return;
  }

  await insertJob(db, MRUTUNJAY_DEMO_JOB);
}

export async function seedJobsIfEmpty(
  db: ReturnType<typeof getDb>
): Promise<void> {
  const existing = await db.select().from(schema.jobs).limit(1);
  if (existing.length > 0) {
    await ensureDemoMatchJob(db);
    return;
  }

  for (const job of SAMPLE_JOBS) {
    await insertJob(db, job);
  }
}

export async function reseedJobs(db: ReturnType<typeof getDb>): Promise<void> {
  await db.delete(schema.jobs).where(eq(schema.jobs.source, "seed"));
  const existing = await db.select().from(schema.jobs).limit(1);
  if (existing.length === 0) {
    for (const job of SAMPLE_JOBS) {
      await insertJob(db, job);
    }
  }
}
