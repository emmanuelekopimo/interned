/* Seed the database with an admin account, reference data and realistic demo content.
 * Usage: npm run db:seed            (idempotent for reference data; skips demo data if present)
 *        npm run db:seed -- --reset (wipes all data first)
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { env } from "../src/env";
import { db } from "../src/db";

import {
  applicationEvents,
  applications,
  companies,
  faqs,
  fields,
  notifications,
  opportunities,
  pages,
  resources,
  savedOpportunities,
  studentProfiles,
  users,
} from "../src/db/schema";

const reset = process.argv.includes("--reset");

function daysFromNow(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const FIELDS = [
  { slug: "computer-science", name: "Computer Science", icon: "monitor", description: "Software, web, mobile and IT support roles." },
  { slug: "engineering", name: "Engineering", icon: "cog", description: "Mechanical, electrical, civil and chemical engineering." },
  { slug: "design", name: "Design", icon: "palette", description: "UI/UX, graphic, product and motion design." },
  { slug: "marketing", name: "Marketing", icon: "megaphone", description: "Digital marketing, social media and communications." },
  { slug: "business", name: "Business", icon: "briefcase", description: "Operations, strategy, sales and administration." },
  { slug: "finance", name: "Finance", icon: "landmark", description: "Banking, investment and financial analysis." },
  { slug: "accounting", name: "Accounting", icon: "calculator", description: "Audit, tax, bookkeeping and reporting." },
  { slug: "data-science", name: "Data Science", icon: "database", description: "Data analysis, BI, machine learning and research." },
  { slug: "education", name: "Education", icon: "graduation-cap", description: "Teaching, tutoring and edtech programs." },
  { slug: "health", name: "Health", icon: "heart-pulse", description: "Healthcare, public health and pharmacy." },
  { slug: "law", name: "Law", icon: "scale", description: "Legal research, compliance and chambers." },
  { slug: "agriculture", name: "Agriculture", icon: "leaf", description: "Agritech, agribusiness and sustainability." },
];

const COMPANIES = [
  { name: "XYZ Technologies", color: "#0b0b0b", industry: "Software Development", location: "Lagos, Nigeria", tagline: "Build • Innovate • Grow", size: "51-200", founded: 2018, verified: true, website: "https://xyztech.com" },
  { name: "ABC Studio", color: "#0b0b0b", industry: "Design & Creative", location: "Lagos, Nigeria", tagline: "Design that moves people", size: "11-50", founded: 2019, verified: true, website: "https://abcstudio.co" },
  { name: "ThinkDigital Media", color: "#6d28d9", industry: "Marketing & Media", location: "Abuja, Nigeria", tagline: "Stories that sell", size: "11-50", founded: 2016, verified: true, website: "https://thinkdigital.ng" },
  { name: "GreenTech Solutions", color: "#15803d", industry: "Data & Analytics", location: "Lagos, Nigeria", tagline: "Data for a greener future", size: "51-200", founded: 2015, verified: true, website: "https://greentech.africa" },
  { name: "Sunrise Media", color: "#0b0b0b", industry: "Media", location: "Uyo, Nigeria", tagline: "Bright ideas, every day", size: "11-50", founded: 2020, verified: true, website: "https://sunrisemedia.ng" },
  { name: "Nexora Systems", color: "#6d28d9", industry: "Technology", location: "Lagos, Nigeria", tagline: "Engineering the future", size: "201-500", founded: 2014, verified: false, website: "https://nexora.io" },
  { name: "TechHive", color: "#1d4ed8", industry: "Software Development", location: "Port Harcourt, Nigeria", tagline: "Where builders grow", size: "11-50", founded: 2021, verified: true, website: "https://techhive.ng" },
  { name: "Finaura", color: "#b45309", industry: "Finance & Consulting", location: "Abuja, Nigeria", tagline: "Smarter money decisions", size: "51-200", founded: 2017, verified: true, website: "https://finaura.com" },
  { name: "HealthPlus", color: "#be123c", industry: "Healthcare", location: "Lagos, Nigeria", tagline: "Care that reaches everyone", size: "500+", founded: 2009, verified: true, website: "https://healthplus.ng" },
  { name: "FinanceHub", color: "#0f766e", industry: "Finance", location: "Lagos, Nigeria", tagline: "Banking made simple", size: "201-500", founded: 2012, verified: true, website: "https://financehub.ng" },
];

type OppSeed = {
  title: string;
  company: string;
  field: string;
  type?: "internship" | "siwes" | "graduate" | "remote_internship" | "volunteer" | "entry_level";
  mode: "remote" | "onsite" | "hybrid";
  location: string;
  stipend: number | null;
  months: number;
  elig: "students" | "graduates" | "both";
  deadline: number;
  verified?: boolean;
  featured?: boolean;
  method?: "internal" | "external" | "email";
  skills: string[];
};

const OPPS: OppSeed[] = [
  { title: "Frontend Developer Intern", company: "XYZ Technologies", field: "computer-science", mode: "remote", location: "Lagos", stipend: 100000, months: 3, elig: "students", deadline: 18, featured: true, skills: ["HTML", "CSS", "JavaScript", "React"] },
  { title: "UI/UX Design Intern", company: "ABC Studio", field: "design", mode: "onsite", location: "Lagos", stipend: 100000, months: 3, elig: "students", deadline: 23, featured: true, skills: ["Figma", "Wireframing", "User Research"] },
  { title: "Marketing Intern", company: "ThinkDigital Media", field: "marketing", mode: "hybrid", location: "Abuja", stipend: 75000, months: 3, elig: "students", deadline: 21, skills: ["Social Media", "Copywriting", "Canva"] },
  { title: "Data Analyst Intern", company: "GreenTech Solutions", field: "data-science", mode: "onsite", location: "Lagos", stipend: 120000, months: 6, elig: "students", deadline: 35, skills: ["Excel", "SQL", "Power BI", "Python"] },
  { title: "Graphic Design Intern", company: "Sunrise Media", field: "design", mode: "remote", location: "Uyo", stipend: 80000, months: 3, elig: "students", deadline: 28, skills: ["Photoshop", "Illustrator", "Branding"] },
  { title: "Software Engineering Intern", company: "Nexora Systems", field: "computer-science", mode: "onsite", location: "Lagos", stipend: 150000, months: 6, elig: "graduates", deadline: 39, verified: false, type: "graduate", skills: ["Java", "Spring", "Git"] },
  { title: "Backend Developer Intern", company: "XYZ Technologies", field: "computer-science", mode: "remote", location: "Lagos", stipend: 110000, months: 6, elig: "both", deadline: 30, skills: ["Node.js", "PostgreSQL", "REST APIs"] },
  { title: "Product Management Intern", company: "XYZ Technologies", field: "business", mode: "hybrid", location: "Lagos", stipend: 90000, months: 3, elig: "students", deadline: 26, skills: ["Communication", "Research", "Jira"] },
  { title: "Mobile App Developer (SIWES)", company: "TechHive", field: "computer-science", type: "siwes", mode: "onsite", location: "Port Harcourt", stipend: 50000, months: 6, elig: "students", deadline: 45, skills: ["Flutter", "Dart", "Firebase"] },
  { title: "IT Support Intern (SIWES)", company: "TechHive", field: "computer-science", type: "siwes", mode: "onsite", location: "Port Harcourt", stipend: 40000, months: 6, elig: "students", deadline: 40, skills: ["Networking", "Troubleshooting", "Windows"] },
  { title: "Financial Analyst Intern", company: "Finaura", field: "finance", mode: "onsite", location: "Abuja", stipend: 100000, months: 3, elig: "both", deadline: 33, skills: ["Excel", "Financial Modelling"] },
  { title: "Audit & Tax Intern", company: "Finaura", field: "accounting", mode: "onsite", location: "Abuja", stipend: 85000, months: 6, elig: "graduates", deadline: 27, type: "graduate", skills: ["Accounting", "Tax", "IFRS"] },
  { title: "Accounting Intern (IT)", company: "FinanceHub", field: "accounting", type: "siwes", mode: "onsite", location: "Lagos", stipend: 60000, months: 6, elig: "students", deadline: 50, skills: ["Bookkeeping", "QuickBooks"] },
  { title: "Customer Experience Intern", company: "FinanceHub", field: "business", mode: "hybrid", location: "Lagos", stipend: 70000, months: 3, elig: "students", deadline: 20, skills: ["Communication", "CRM"] },
  { title: "Public Health Intern", company: "HealthPlus", field: "health", mode: "onsite", location: "Lagos", stipend: 80000, months: 6, elig: "graduates", deadline: 42, skills: ["Research", "Community Outreach"] },
  { title: "Pharmacy Operations Intern", company: "HealthPlus", field: "health", mode: "onsite", location: "Ibadan", stipend: 70000, months: 3, elig: "students", deadline: 36, skills: ["Inventory", "Customer Service"] },
  { title: "Content Writing Intern", company: "ThinkDigital Media", field: "marketing", type: "remote_internship", mode: "remote", location: "Abuja", stipend: 60000, months: 3, elig: "both", deadline: 24, skills: ["Writing", "SEO", "Research"] },
  { title: "Social Media Volunteer", company: "Sunrise Media", field: "marketing", type: "volunteer", mode: "remote", location: "Uyo", stipend: null, months: 1, elig: "both", deadline: 16, skills: ["Instagram", "TikTok", "Canva"] },
  { title: "Machine Learning Intern", company: "GreenTech Solutions", field: "data-science", mode: "remote", location: "Lagos", stipend: 140000, months: 6, elig: "graduates", deadline: 48, method: "external", skills: ["Python", "scikit-learn", "Pandas"] },
  { title: "Civil Engineering Intern", company: "Nexora Systems", field: "engineering", type: "siwes", mode: "onsite", location: "Abuja", stipend: 65000, months: 6, elig: "students", deadline: 55, verified: false, skills: ["AutoCAD", "Site Supervision"] },
  { title: "Electrical Engineering Intern", company: "Nexora Systems", field: "engineering", mode: "onsite", location: "Lagos", stipend: 90000, months: 12, elig: "graduates", deadline: 60, verified: false, type: "graduate", skills: ["Circuit Design", "MATLAB"] },
  { title: "Brand Design Intern", company: "ABC Studio", field: "design", mode: "hybrid", location: "Lagos", stipend: 85000, months: 3, elig: "students", deadline: 31, method: "email", skills: ["Branding", "Illustrator"] },
  { title: "Business Development Intern", company: "Finaura", field: "business", mode: "hybrid", location: "Abuja", stipend: 80000, months: 3, elig: "both", deadline: 29, skills: ["Sales", "Negotiation", "Excel"] },
  { title: "Legal Research Intern", company: "FinanceHub", field: "law", mode: "onsite", location: "Lagos", stipend: 75000, months: 3, elig: "graduates", deadline: 34, skills: ["Legal Research", "Drafting"] },
];

const RESOURCES = [
  {
    title: "How to Write a CV With No Work Experience",
    category: "cv-tips",
    minutes: 5,
    cover: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80",
    excerpt: "You don't need years of experience to write a great CV. What you need is the right structure, focus and a clear way to show your value.",
    content: `You don't need years of experience to write a great CV. What you need is the right structure, focus and a clear way to show your value. Here's how to do it.

## 1. Start with your personal information

Full name, email, phone number and location. Add a LinkedIn or portfolio link if you have one. Skip your date of birth, marital status and religion — they are not needed.

## 2. Add a strong summary

Two or three sentences about who you are, what you study and what you want. For example: *"Final year Computer Science student at the University of Uyo with hands-on experience building web apps in React. Looking for a frontend internship where I can learn from experienced engineers."*

## 3. Lead with education and projects

When you don't have work experience, your projects **are** your experience. Include class projects, personal projects, hackathons and volunteering.

- What did you build or do?
- Which tools did you use?
- What was the result?

## 4. Highlight transferable skills

Leadership in a student association, organising an event, tutoring classmates — all of these show responsibility and communication.

## 5. Keep it to one page

Recruiters spend seconds on each CV. Use clear headings, consistent fonts and bullet points. Save it as a PDF.

> Tip: tailor your CV for every application. Mirror the keywords you see in the opportunity's requirements.`,
  },
  {
    title: "Top 10 Skills Every Computer Science Student Should Learn",
    category: "skills",
    minutes: 7,
    cover: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    excerpt: "From Git to communication, these are the skills that make interns stand out in tech teams.",
    content: `Technology changes fast, but some skills stay valuable year after year.

## Technical skills

1. **Git & GitHub** — every team uses version control.
2. **One programming language, deeply** — JavaScript, Python or Java.
3. **Data structures & algorithms** — for problem solving and interviews.
4. **SQL** — almost every product stores data in a database.
5. **Web fundamentals** — HTTP, HTML, CSS and APIs.
6. **Testing** — writing code you can trust.

## Soft skills

7. **Written communication** — clear messages save everyone time.
8. **Asking good questions** — show what you tried before asking.
9. **Time management** — deliver what you promise.
10. **Learning how to learn** — documentation is your best friend.`,
  },
  {
    title: "How to Prepare for Your First Internship Interview",
    category: "interview-prep",
    minutes: 6,
    cover: "https://images.unsplash.com/photo-1565688534245-05d6b5be184a?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Research, practice and a few smart questions will set you apart from other candidates.",
    content: `Your first interview can feel intimidating. Preparation makes all the difference.

## Research the company

Read their website, recent news and social media. Understand what they do and who their customers are.

## Practice common questions

- Tell me about yourself.
- Why do you want this internship?
- Tell me about a project you're proud of.
- How do you handle deadlines?

Use the **STAR** method: Situation, Task, Action, Result.

## Prepare your own questions

Ask about the team, what a typical day looks like and how interns are mentored.

## On the day

Arrive 10 minutes early (or test your internet for virtual interviews), dress neatly and follow up with a thank-you email.`,
  },
  {
    title: "A Complete Guide to SIWES in Nigeria",
    category: "siwes",
    minutes: 8,
    cover: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Everything you need to know about the Students Industrial Work Experience Scheme — from placement to your final report.",
    content: `The Students Industrial Work Experience Scheme (SIWES) is a skills training programme that exposes students to real industry work.

## Who is eligible?

Students in Nigerian universities, polytechnics and colleges of education in approved courses — usually engineering, sciences, technology, agriculture and some management courses.

## Finding a placement

Start early. Use Internly's **SIWES / IT** filter, ask your department's SIWES coordinator and reach out to companies directly.

## Documents you'll need

- Acceptance letter from the company
- SIWES logbook
- ITF forms from your institution

## Making the most of it

Treat it like a real job. Keep your logbook updated daily, ask to shadow different teams and collect references before you leave.`,
  },
  {
    title: "Building a Portfolio as a Student",
    category: "career-growth",
    minutes: 5,
    cover: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    excerpt: "A portfolio proves what you can do. Here's how to build one even if you're just getting started.",
    content: `A portfolio is proof of your skills. It doesn't need to be fancy — it needs to be clear.

## Pick 3–5 of your best projects

Quality beats quantity. For each project explain the problem, your role, the tools you used and the outcome.

## Choose a home

Designers can use Behance or Dribbble. Developers can use GitHub plus a simple personal site. Writers can use Medium or a blog.

## Keep it updated

Add new work every semester and remove weaker pieces.`,
  },
  {
    title: "How to Find Legitimate Internship Opportunities",
    category: "career-growth",
    minutes: 4,
    cover: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    excerpt: "Learn to spot red flags and protect yourself from internship scams.",
    content: `Unfortunately, not every internship listing is real. Here's how to stay safe.

## Red flags

- You're asked to **pay** for training, registration or a uniform.
- The company has no website or verifiable address.
- Communication happens only via personal messaging apps.
- The offer seems too good to be true.

## Stay safe

Look for the **Verified** badge on Internly, research the company and never send money. If something feels off, use the **Report** button on the opportunity page.`,
  },
];

const FAQS = [
  { q: "Is Internly free to use?", a: "Yes. Internly is completely free for students and graduates. You can search, save and apply for opportunities at no cost.", c: "General" },
  { q: "How do I apply for an internship?", a: "Open any opportunity and click **Apply Now**. Some opportunities use our step-by-step application form, while others link to the company's own application page.", c: "Students" },
  { q: "Are the opportunities verified?", a: "Our team reviews companies and opportunities before they go live. Look for the green **Verified** badge. If you notice anything suspicious, please report it.", c: "Safety" },
  { q: "Can companies post internships on Internly?", a: "Yes. Create a company account, complete your company profile and post an opportunity. Posts from new companies are reviewed before publishing.", c: "Companies" },
  { q: "Will I ever be asked to pay for an internship?", a: "Never. Legitimate internships do not ask for payment. Report any opportunity that asks you for money.", c: "Safety" },
  { q: "How do opportunity alerts work?", a: "Set your preferred fields, locations and types and we'll email you when new opportunities match.", c: "Students" },
  { q: "How do I get support if I have an issue?", a: "Reach us via the Contact page or email hello@internly.ng. We typically respond within one business day.", c: "General" },
];

const PAGES = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "How we collect, use and protect your information.",
    content: `We respect your privacy. This policy explains what information we collect and how we use it.

## Information we collect

- **Account information** — name, email address, phone number and password.
- **Profile information** — school, course, level, skills, CV and links you choose to add.
- **Application information** — details and documents you submit to companies.
- **Usage information** — pages visited and actions taken, used to improve Internly.

## How we use your information

- To provide and improve our services
- To match you with relevant opportunities
- To share your application with the company you apply to
- To communicate with you about your account and applications
- To keep the platform safe and prevent fraud

## Sharing

We only share your application details with the companies you apply to. We never sell your personal data.

## Your choices

You can update your profile, change notification preferences or delete your account at any time from Settings.

## Contact

Questions? Email us at hello@internly.ng.`,
  },
  {
    slug: "terms",
    title: "Terms of Service",
    summary: "The rules for using Internly.",
    content: `By using Internly you agree to these terms.

## Accounts

You must provide accurate information and keep your password secure. You are responsible for activity on your account.

## For students

Only apply for opportunities you are genuinely interested in, and make sure the information and documents you submit are truthful.

## For companies

Opportunities must be real, lawful and must never require payment from applicants. We may remove listings or suspend accounts that break these rules.

## Content

You keep ownership of content you upload but grant Internly permission to display it in order to provide the service.

## Limitation of liability

Internly connects students and companies but is not party to any agreement between them. We work hard to verify listings but cannot guarantee every opportunity.

## Changes

We may update these terms from time to time. Continued use of Internly means you accept the updated terms.`,
  },
  {
    slug: "about",
    title: "About Internly",
    summary: "We're on a mission to connect students with real opportunities.",
    content: `Internly is a dedicated platform that helps students discover and apply for internship opportunities from companies and organizations. We believe that every student deserves access to genuine opportunities that can shape their future.

We started Internly after seeing talented students struggle to find legitimate placements — relying on word of mouth, crowded group chats and, too often, scams. Today we work with companies across Nigeria to make finding and filling internships simple, safe and fair.`,
  },
];

async function main() {
  if (reset) {
    console.log("Resetting database…");
    await db.execute(sql`truncate table
      application_events, applications, saved_opportunities, notifications, alerts, reports,
      opportunities, companies, student_profiles, password_resets, users, fields, resources, faqs,
      contact_messages, pages, settings restart identity cascade`);
  }

  const adminEmail = env.SEED_ADMIN_EMAIL.toLowerCase();
  const adminPassword = env.SEED_ADMIN_PASSWORD;

  const hash = (p: string) => bcrypt.hash(p, 10);

  await db
    .insert(users)
    .values({ name: "Internly Admin", email: adminEmail, passwordHash: await hash(adminPassword), role: "admin" })
    .onConflictDoNothing();
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);

  await db
    .insert(fields)
    .values(FIELDS.map((f, i) => ({ ...f, sortOrder: i })))
    .onConflictDoNothing();
  await db
    .insert(pages)
    .values(PAGES)
    .onConflictDoNothing();
  if ((await db.select({ n: sql<number>`count(*)::int` }).from(faqs))[0].n === 0) {
    await db.insert(faqs).values(FAQS.map((f, i) => ({ question: f.q, answer: f.a, category: f.c, sortOrder: i })));
  }
  await db
    .insert(resources)
    .values(
      RESOURCES.map((r, i) => ({
        slug: r.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        title: r.title,
        category: r.category,
        readMinutes: r.minutes,
        coverUrl: r.cover,
        excerpt: r.excerpt,
        content: r.content,
        featured: i === 0,
        publishedAt: new Date(Date.now() - i * 3 * 86400000),
      })),
    )
    .onConflictDoNothing();

  const existingCompanies = await db.select({ n: sql<number>`count(*)::int` }).from(companies);
  if (existingCompanies[0].n > 0) {
    console.log("Demo data already present — skipping companies/opportunities. Use --reset to reseed.");
    process.exit(0);
  }

  const password = await hash("Password123");
  const fieldRows = await db.select().from(fields);
  const fieldBySlug = Object.fromEntries(fieldRows.map((f) => [f.slug, f.id]));

  const companyIds: Record<string, { id: string; ownerId: string }> = {};
  for (const c of COMPANIES) {
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const [owner] = await db
      .insert(users)
      .values({ name: `${c.name} HR`, email: `hr@${slug.replace(/-/g, "")}.com`, passwordHash: password, role: "company" })
      .returning();
    const [row] = await db
      .insert(companies)
      .values({
        slug,
        name: c.name,
        ownerId: owner.id,
        brandColor: c.color,
        tagline: c.tagline,
        industry: c.industry,
        location: c.location,
        website: c.website,
        email: owner.email,
        size: c.size,
        foundedYear: c.founded,
        verified: c.verified,
        status: "active",
        coverUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
        description: `${c.name} is a ${c.industry.toLowerCase()} company based in ${c.location}. We build products and services that help people and businesses grow. Our internship program is designed to give students real-world experience and hands-on learning alongside experienced mentors.`,
      })
      .returning();
    companyIds[c.name] = { id: row.id, ownerId: owner.id };
  }

  const oppIds: string[] = [];
  for (const [i, o] of OPPS.entries()) {
    const company = companyIds[o.company];
    const slug = o.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + o.company.split(" ")[0].toLowerCase();
    const [row] = await db
      .insert(opportunities)
      .values({
        slug,
        title: o.title,
        companyId: company.id,
        fieldId: fieldBySlug[o.field],
        type: o.type ?? (o.mode === "remote" ? "remote_internship" : "internship"),
        workMode: o.mode,
        location: o.location,
        stipend: o.stipend,
        paid: o.stipend != null,
        durationMonths: o.months,
        eligibility: o.elig,
        summary: `Join ${o.company} as a ${o.title} and gain hands-on experience.`,
        description: `We're looking for a passionate ${o.title.replace(/ \(.*\)/, "").toLowerCase()} to join our growing team. You'll work on real projects, learn from experienced professionals, and gain hands-on experience in a supportive environment.\n\nThis is a great opportunity for ${o.elig === "graduates" ? "recent graduates" : "students"} who want to build practical skills and grow their career.`,
        requirements: [
          `Basic knowledge of ${o.skills.slice(0, 2).join(" and ")}`,
          o.skills[2] ? `${o.skills[2]} is a plus` : "Willingness to learn",
          "Good communication skills",
          o.elig === "graduates" ? "Completed a bachelor's degree or HND" : "Currently enrolled in a university or polytechnic",
        ],
        learnings: ["Working with real-world projects", "Collaborating in a professional team", "Industry tools and best practices", "Professional communication"],
        responsibilities: ["Support the team on day-to-day tasks", "Contribute to ongoing projects", "Attend team meetings and share progress", "Document your work"],
        benefits: [o.stipend ? "Monthly stipend" : "Certificate of participation", "Mentorship from senior staff", "Letter of recommendation", "Flexible working hours"],
        skills: o.skills,
        applicationMethod: o.method ?? "internal",
        externalUrl: o.method === "external" ? "https://careers.example.com/apply" : null,
        applicationEmail: o.method === "email" ? "careers@example.com" : null,
        deadline: daysFromNow(o.deadline),
        startDate: daysFromNow(o.deadline + 14),
        openings: 1 + (i % 4),
        status: "published",
        verified: o.verified ?? true,
        featured: o.featured ?? false,
        views: 40 + ((i * 37) % 300),
        postedById: company.ownerId,
        publishedAt: new Date(Date.now() - i * 7 * 3600 * 1000),
      })
      .returning();
    oppIds.push(row.id);
  }
  // One pending opportunity for the admin review queue.
  await db.insert(opportunities).values({
    slug: "operations-intern-nexora",
    title: "Operations Intern",
    companyId: companyIds["Nexora Systems"].id,
    fieldId: fieldBySlug["business"],
    workMode: "onsite",
    location: "Lagos",
    stipend: 70000,
    durationMonths: 3,
    description: "Support our operations team with scheduling, logistics and reporting.",
    requirements: ["Organised", "Good with spreadsheets"],
    deadline: daysFromNow(30),
    status: "pending",
    postedById: companyIds["Nexora Systems"].ownerId,
  });

  // Demo student with activity.
  const [student] = await db
    .insert(users)
    .values({ name: "Abasianam Boniface", email: "student@internly.ng", passwordHash: password, role: "student", phone: "+234 803 123 4567" })
    .returning();
  await db.insert(studentProfiles).values({
    userId: student.id,
    headline: "Computer Science student & aspiring frontend engineer",
    school: "University of Uyo",
    course: "Computer Science",
    level: "300 Level",
    location: "Uyo, Akwa Ibom",
    bio: "I love building clean, accessible web interfaces and learning how great products are made.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Figma"],
    interests: [fieldBySlug["computer-science"], fieldBySlug["design"]],
    projects: [{ title: "Portfolio Website", url: "https://example.com", description: "Personal site built with Next.js" }],
    links: { github: "https://github.com/", linkedin: "https://linkedin.com/" },
  });
  const statuses = ["under_review", "shortlisted", "interview", "rejected"] as const;
  for (const [i, status] of statuses.entries()) {
    const [app] = await db
      .insert(applications)
      .values({
        opportunityId: oppIds[i],
        userId: student.id,
        fullName: student.name,
        email: student.email,
        phone: student.phone,
        school: "University of Uyo",
        course: "Computer Science",
        level: "300 Level",
        coverLetter: "I'm excited to apply for this role and believe my projects show my passion for learning.",
        status,
        step: 3,
        submittedAt: new Date(Date.now() - (i + 1) * 3 * 86400000),
      })
      .returning();
    await db.insert(applicationEvents).values({ applicationId: app.id, status: "submitted", note: "Application submitted", createdAt: new Date(Date.now() - (i + 1) * 3 * 86400000) });
    if (status !== "under_review") await db.insert(applicationEvents).values({ applicationId: app.id, status: "under_review" });
    if (status === "interview") await db.insert(applicationEvents).values({ applicationId: app.id, status: "shortlisted" });
    await db.insert(applicationEvents).values({ applicationId: app.id, status });
  }
  await db.insert(savedOpportunities).values([oppIds[0], oppIds[1], oppIds[2], oppIds[5]].map((opportunityId) => ({ userId: student.id, opportunityId })));
  await db.insert(notifications).values([
    { userId: student.id, type: "application", title: "Your application to UI/UX Design Intern was shortlisted", link: "/dashboard/applications", createdAt: new Date(Date.now() - 2 * 86400000) },
    { userId: student.id, type: "opportunity", title: "New opportunity: Backend Developer Intern", link: "/opportunities", createdAt: new Date(Date.now() - 3 * 86400000) },
    { userId: student.id, type: "saved", title: "You saved Marketing Intern", link: "/dashboard/saved", readAt: new Date(), createdAt: new Date(Date.now() - 4 * 86400000) },
  ]);

  // A few more applicants so company dashboards have data.
  const names = ["Chiamaka Obi", "Tunde Adeyemi", "Blessing Etim", "Ibrahim Musa", "Grace Okon", "David Nwosu"];
  for (const [i, name] of names.entries()) {
    const [u] = await db
      .insert(users)
      .values({ name, email: `${name.split(" ")[0].toLowerCase()}@example.com`, passwordHash: password, role: "student" })
      .returning();
    await db.insert(studentProfiles).values({ userId: u.id, school: "University of Lagos", course: "Computer Science", level: `${(i % 4) + 2}00 Level`, skills: ["JavaScript", "React"] });
    const [app] = await db
      .insert(applications)
      .values({
        opportunityId: oppIds[i % 3],
        userId: u.id,
        fullName: name,
        email: u.email,
        phone: "+234 800 000 000" + i,
        school: "University of Lagos",
        course: "Computer Science",
        level: `${(i % 4) + 2}00 Level`,
        status: (["submitted", "under_review", "shortlisted", "interview", "submitted", "accepted"] as const)[i],
        step: 3,
        submittedAt: new Date(Date.now() - i * 86400000),
      })
      .returning();
    await db.insert(applicationEvents).values({ applicationId: app.id, status: "submitted", note: "Application submitted" });
  }

  console.log("Seed complete.");
  console.log("Demo student: student@internly.ng / Password123");
  console.log("Demo company: hr@xyztechnologies.com / Password123");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
