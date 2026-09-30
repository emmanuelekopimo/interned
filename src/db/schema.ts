import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const bytea = customType<{ data: Buffer; driverData: string | Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(val: Buffer): string {
    return "\\x" + val.toString("hex");
  },
  fromDriver(val: unknown): Buffer {
    if (Buffer.isBuffer(val)) return val;
    if (typeof val === "string") {
      return val.startsWith("\\x") ? Buffer.from(val.slice(2), "hex") : Buffer.from(val, "hex");
    }
    if (val instanceof Uint8Array) {
      return Buffer.from(val);
    }
    return Buffer.from(String(val));
  },
});

export const userRole = pgEnum("user_role", ["student", "company", "admin"]);
export const userStatus = pgEnum("user_status", ["active", "suspended"]);
export const opportunityType = pgEnum("opportunity_type", [
  "internship",
  "siwes",
  "graduate",
  "remote_internship",
  "volunteer",
  "entry_level",
]);
export const workMode = pgEnum("work_mode", ["remote", "onsite", "hybrid"]);
export const eligibility = pgEnum("eligibility", ["students", "graduates", "both"]);
export const opportunityStatus = pgEnum("opportunity_status", [
  "draft",
  "pending",
  "published",
  "closed",
  "rejected",
]);
export const applicationMethod = pgEnum("application_method", ["internal", "external", "email"]);
export const applicationStatus = pgEnum("application_status", [
  "draft",
  "submitted",
  "under_review",
  "shortlisted",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
]);
export const companyStatus = pgEnum("company_status", ["pending", "active", "suspended"]);
export const reportStatus = pgEnum("report_status", ["open", "reviewing", "resolved", "dismissed"]);
export const messageStatus = pgEnum("message_status", ["new", "read", "replied", "archived"]);
export const alertFrequency = pgEnum("alert_frequency", ["instant", "daily", "weekly"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("student"),
    status: userStatus("status").notNull().default("active"),
    avatarUrl: text("avatar_url"),
    phone: text("phone"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_idx").on(sql`lower(${t.email})`)],
);

export type NotificationPrefs = {
  emailAlerts: boolean;
  applicationUpdates: boolean;
  newsletter: boolean;
};

export type ProjectItem = { title: string; url?: string; description?: string };
export type ExperienceItem = { role: string; company: string; period?: string; description?: string };
export type SocialLinks = { linkedin?: string; github?: string; twitter?: string; portfolio?: string; instagram?: string };

export const studentProfiles = pgTable("student_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  school: text("school"),
  course: text("course"),
  level: text("level"),
  location: text("location"),
  bio: text("bio"),
  skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
  interests: text("interests").array().notNull().default(sql`'{}'::text[]`),
  experience: jsonb("experience").$type<ExperienceItem[]>().notNull().default([]),
  projects: jsonb("projects").$type<ProjectItem[]>().notNull().default([]),
  links: jsonb("links").$type<SocialLinks>().notNull().default({}),
  cvUrl: text("cv_url"),
  cvName: text("cv_name"),
  notificationPrefs: jsonb("notification_prefs")
    .$type<NotificationPrefs>()
    .notNull()
    .default({ emailAlerts: true, applicationUpdates: true, newsletter: false }),
  profileVisible: boolean("profile_visible").notNull().default(true),
  ...timestamps,
});

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
    logoUrl: text("logo_url"),
    brandColor: text("brand_color").notNull().default("#111827"),
    coverUrl: text("cover_url"),
    tagline: text("tagline"),
    description: text("description"),
    industry: text("industry"),
    location: text("location"),
    website: text("website"),
    email: text("email"),
    phone: text("phone"),
    size: text("size"),
    foundedYear: integer("founded_year"),
    verified: boolean("verified").notNull().default(false),
    status: companyStatus("status").notNull().default("pending"),
    socials: jsonb("socials").$type<SocialLinks>().notNull().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex("companies_slug_idx").on(t.slug), index("companies_owner_idx").on(t.ownerId)],
);

export const fields = pgTable(
  "fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("briefcase"),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("fields_slug_idx").on(t.slug)],
);

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id").references(() => fields.id, { onDelete: "set null" }),
    type: opportunityType("type").notNull().default("internship"),
    workMode: workMode("work_mode").notNull().default("onsite"),
    location: text("location").notNull(),
    stipend: integer("stipend"),
    paid: boolean("paid").notNull().default(true),
    durationMonths: integer("duration_months"),
    eligibility: eligibility("eligibility").notNull().default("students"),
    summary: text("summary"),
    description: text("description").notNull(),
    requirements: text("requirements").array().notNull().default(sql`'{}'::text[]`),
    learnings: text("learnings").array().notNull().default(sql`'{}'::text[]`),
    responsibilities: text("responsibilities").array().notNull().default(sql`'{}'::text[]`),
    benefits: text("benefits").array().notNull().default(sql`'{}'::text[]`),
    skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
    applicationMethod: applicationMethod("application_method").notNull().default("internal"),
    externalUrl: text("external_url"),
    applicationEmail: text("application_email"),
    requireCoverLetter: boolean("require_cover_letter").notNull().default(false),
    deadline: date("deadline", { mode: "string" }),
    startDate: date("start_date", { mode: "string" }),
    openings: integer("openings").notNull().default(1),
    status: opportunityStatus("status").notNull().default("pending"),
    verified: boolean("verified").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    views: integer("views").notNull().default(0),
    rejectionReason: text("rejection_reason"),
    postedById: uuid("posted_by_id").references(() => users.id, { onDelete: "set null" }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("opportunities_slug_idx").on(t.slug),
    index("opportunities_company_idx").on(t.companyId),
    index("opportunities_status_idx").on(t.status, t.publishedAt),
  ],
);

export const savedOpportunities = pgTable(
  "saved_opportunities",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.opportunityId] })],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    school: text("school"),
    course: text("course"),
    level: text("level"),
    coverLetter: text("cover_letter"),
    cvUrl: text("cv_url"),
    cvName: text("cv_name"),
    coverLetterUrl: text("cover_letter_url"),
    coverLetterName: text("cover_letter_name"),
    portfolioUrl: text("portfolio_url"),
    status: applicationStatus("status").notNull().default("draft"),
    companyNote: text("company_note"),
    step: integer("step").notNull().default(1),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("applications_unique_idx").on(t.opportunityId, t.userId),
    index("applications_user_idx").on(t.userId),
  ],
);

export const applicationEvents = pgTable("application_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  status: applicationStatus("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  keywords: text("keywords"),
  fieldIds: text("field_ids").array().notNull().default(sql`'{}'::text[]`),
  locations: text("locations").array().notNull().default(sql`'{}'::text[]`),
  types: text("types").array().notNull().default(sql`'{}'::text[]`),
  workModes: text("work_modes").array().notNull().default(sql`'{}'::text[]`),
  frequency: alertFrequency("frequency").notNull().default("weekly"),
  active: boolean("active").notNull().default(true),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
  ...timestamps,
});

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email"),
  reason: text("reason").notNull(),
  details: text("details"),
  status: reportStatus("status").notNull().default("open"),
  adminNote: text("admin_note"),
  ...timestamps,
});

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    category: text("category").notNull(),
    coverUrl: text("cover_url"),
    readMinutes: integer("read_minutes").notNull().default(5),
    authorName: text("author_name").notNull().default("Internly Team"),
    published: boolean("published").notNull().default(true),
    featured: boolean("featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow(),
    ...timestamps,
  },
  (t) => [uniqueIndex("resources_slug_idx").on(t.slug)],
);

export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull().default("General"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  ...timestamps,
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  status: messageStatus("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pages = pgTable("pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  ...timestamps,
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  ...timestamps,
});

/* ---------------- relations ---------------- */

export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, { fields: [users.id], references: [studentProfiles.userId] }),
  applications: many(applications),
  saved: many(savedOpportunities),
  notifications: many(notifications),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, { fields: [studentProfiles.userId], references: [users.id] }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, { fields: [companies.ownerId], references: [users.id] }),
  opportunities: many(opportunities),
}));

export const fieldsRelations = relations(fields, ({ many }) => ({
  opportunities: many(opportunities),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  company: one(companies, { fields: [opportunities.companyId], references: [companies.id] }),
  field: one(fields, { fields: [opportunities.fieldId], references: [fields.id] }),
  applications: many(applications),
  reports: many(reports),
}));

export const savedRelations = relations(savedOpportunities, ({ one }) => ({
  user: one(users, { fields: [savedOpportunities.userId], references: [users.id] }),
  opportunity: one(opportunities, {
    fields: [savedOpportunities.opportunityId],
    references: [opportunities.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  opportunity: one(opportunities, { fields: [applications.opportunityId], references: [opportunities.id] }),
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  events: many(applicationEvents),
}));

export const applicationEventsRelations = relations(applicationEvents, ({ one }) => ({
  application: one(applications, {
    fields: [applicationEvents.applicationId],
    references: [applications.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  opportunity: one(opportunities, { fields: [reports.opportunityId], references: [opportunities.id] }),
  reporter: one(users, { fields: [reports.reporterId], references: [users.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, { fields: [alerts.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Field = typeof fields.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ApplicationStatus = (typeof applicationStatus.enumValues)[number];
export type OpportunityStatus = (typeof opportunityStatus.enumValues)[number];
export type OpportunityType = (typeof opportunityType.enumValues)[number];
export type WorkMode = (typeof workMode.enumValues)[number];
export type Eligibility = (typeof eligibility.enumValues)[number];
export type FileRecord = typeof files.$inferSelect;
