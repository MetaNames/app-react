// Guards against two ways an "unset" env var can slip through as a truthy string:
// an empty string, and the literal string "undefined" (seen when a build tool or
// platform stringifies a missing variable instead of omitting it). Plain `??`/`||`
// only catches the real `undefined` value, so either of those cases would silently
// pass through as the "value" instead of falling back.
export const optionalEnv = (
  value: string | undefined,
  fallback: string,
): string => {
  if (value === undefined || value === "" || value === "undefined")
    return fallback;

  return value;
};
