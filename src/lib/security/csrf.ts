export function assertCsrf(request: Request): void {
  if (!request.headers.get("x-requested-with")) {
    throw new Error("Missing CSRF header");
  }
}
