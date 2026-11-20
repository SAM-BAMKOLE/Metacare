import { betterAuth } from "better-auth/minimal"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import { user, session, account, verification } from "@/db/schema"
import { cookies } from "next/headers"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookie: {
      name: "better-auth.session_token",
      domain: process.env.BETTER_AUTH_URL?.replace("https://", "").replace(
        "http://",
        ""
      ),
      path: "/",
      sameSite: "lax",
      secure: true, // Required for __Secure- prefix
      httpOnly: true,
    },
  },
})

export type Session = typeof auth.$Infer.Session

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")
  return auth.api.getSession({
    headers: { cookie: cookieHeader },
  })
}
