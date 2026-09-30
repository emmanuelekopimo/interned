import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(16),

    APP_URL: z.string().url().default("http://localhost:3000"),
    UPLOAD_DIR: z.string().default("./uploads"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    SEED_ADMIN_EMAIL: z.string().email().default("admin@internly.ng"),

    SEED_ADMIN_PASSWORD: z.string().default("Admin@12345"),
    CRON_SECRET: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {},
  experimental__runtimeEnv: {},
  emptyStringAsUndefined: true,
});
