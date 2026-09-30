import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { companies, users, type User } from "@/db/schema";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";
import { env } from "@/env";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: Pick<User, "id" | "role">) {
  const token = await signSession({ sub: user.id, role: user.role });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}


export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export type CurrentUser = Omit<User, "passwordHash">;

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, session.sub) });
  if (!user || user.status !== "active") return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
});

export async function requireUser(roles?: User["role"][], next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  if (roles && !roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

export function homeFor(role: User["role"]) {
  if (role === "admin") return "/admin";
  if (role === "company") return "/company";
  return "/dashboard";
}

export const getCompanyForUser = cache(async (userId: string) => {
  return (await db.query.companies.findFirst({ where: eq(companies.ownerId, userId) })) ?? null;
});

export async function requireCompany() {
  const user = await requireUser(["company"], "/company");
  const company = await getCompanyForUser(user.id);
  if (!company) redirect("/company/setup");
  return { user, company };
}
