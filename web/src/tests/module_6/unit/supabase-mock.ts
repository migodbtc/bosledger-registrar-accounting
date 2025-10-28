// Simple chainable supabase mock returning predictable results for unit tests
export function createSupabaseMock(
  result: any = { data: [], error: null, count: 0 }
) {
  let requestedCount = false;
  const chain: any = {
    select: (...args: any[]) => {
      const maybeOptions = args[1];
      if (
        maybeOptions &&
        typeof maybeOptions === "object" &&
        "count" in maybeOptions
      ) {
        requestedCount = true;
      }
      return chain;
    },
    eq: (_: string, __: any) => chain,
    order: (_: string, __: any) => chain,
    range: (_: number, __: number) => chain,
    in: (_: string, __: any) => chain,
    then: (resolve: any) => {
      const out = { ...(result || {}) };
      if (requestedCount && typeof out.count === "undefined") out.count = 0;
      resolve(out);
    },
    catch: (_: any) => chain,
  } as any;

  const supabase = { from: (_table: string) => chain } as any;
  return { supabase };
}
