export function resolveLoginRedirectPath(
  nextPath: string | string[] | undefined,
) {
  if (typeof nextPath !== "string") {
    return "/";
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}
