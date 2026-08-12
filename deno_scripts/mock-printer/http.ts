/** Response builders and the shared route-handler shape. */

export type RouteHandler = (
	req: Request,
	url: URL,
) => Response | Promise<Response>;

export const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, X-Session-Key",
	"Access-Control-Expose-Headers": "X-Session-Key",
};

export function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json", ...corsHeaders },
	});
}

export function text(body: string, status = 200): Response {
	return new Response(body, {
		status,
		headers: { "Content-Type": "text/plain", ...corsHeaders },
	});
}

export function paginate<T>(
	entries: T[],
	url: URL,
): { slice: T[]; first: number; next: number } {
	const first = Number(url.searchParams.get("first") ?? "0") || 0;
	const maxParam = url.searchParams.get("max");
	const max = maxParam ? Number(maxParam) : entries.length;
	const slice = entries.slice(first, first + max);
	const consumed = first + slice.length;
	return { slice, first, next: consumed < entries.length ? consumed : 0 };
}
