// A dictionary crosses to the client and a function cannot: React refuses to
// serialise one. Strings that need a value carry a {name} for it instead.
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  );
}
