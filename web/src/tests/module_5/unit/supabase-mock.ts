// Simple chainable supabase mock returning predictable results for unit tests
export function createSupabaseMock(
  result: any = { data: [], error: null, count: 0 }
) {
  let requestedCount = false;
  const chain: any = {
    select: (...args: any[]) => {
      // detect second-arg options like { count: 'exact' }
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
    // thenable so `await` works
    then: (resolve: any) => {
      const out = { ...(result || {}) };
      if (requestedCount && typeof out.count === "undefined") out.count = 0;
      resolve(out);
    },
    catch: (_: any) => chain,
  } as any;

  // supabase.from(table) -> chain
  const supabase = {
    from: (_table: string) => chain,
  } as any;

  return { supabase };
}
