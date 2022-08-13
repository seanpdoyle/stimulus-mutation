export function parseTokenString(tokenString: string | null): string[] {
  return (tokenString || "").trim().split(/\s+/).filter(content => content.length)
}
