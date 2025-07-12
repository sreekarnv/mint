import type { AppError } from '@/types/error';

export type FetcherOptions<TBody> = Omit<RequestInit, 'body'> & {
	body?: TBody;
};

export async function fetcher<TResponse, TBody = unknown>(
	url: string,
	options: FetcherOptions<TBody> = {}
): Promise<TResponse> {
	const { body, headers, ...rest } = options;

	const fetchOptions: RequestInit = {
		...rest,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include',
	};

	const resp = await fetch(import.meta.env.VITE_SERVER_URL + url, fetchOptions);

	if (!resp.ok) {
		let errorMsg = `Request failed with status ${resp.status}`;
		try {
			const err = (await resp.json()) as AppError;
			if (err?.error) {
				errorMsg = err.error;
			}
		} catch {
			const text = await resp.text();
			if (text) errorMsg = text;
		}
		throw new Error(errorMsg);
	}

	return resp.json() as Promise<TResponse>;
}
