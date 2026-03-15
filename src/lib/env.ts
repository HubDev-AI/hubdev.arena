import { z } from "zod";

export type DataMode = "mock" | "supabase";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  SEC4_INTERNAL_BASE_URL: z.string().url().optional(),
  SEC4_INTERNAL_TOKEN: z.string().optional(),
  ADMIN_ALLOWLIST: z.string().default(""),
  HUBDEV_DATA_MODE: z.enum(["mock", "supabase"]).optional(),
  HUBDEV_COOKIE_SECRET: z.string().min(1),
  HUBDEV_FINGERPRINT_SECRET: z.string().min(1),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}

export function getAdminAllowlist() {
  return getEnv()
    .ADMIN_ALLOWLIST.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveDataMode(env: Partial<z.infer<typeof envSchema>>): DataMode {
  if (env.HUBDEV_DATA_MODE) {
    return env.HUBDEV_DATA_MODE;
  }

  if (
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return "supabase";
  }

  return "mock";
}

export function getDataMode() {
  return resolveDataMode(getEnv());
}
