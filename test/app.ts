import { assertEquals } from 'std/assert/mod.ts';

import app from '~/app.ts';

const request = async (input: RequestInfo | URL, requestInit?: RequestInit) => {
	const response = await app.request(input, requestInit);
	return ({ status, contentType }: { status?: number; contentType?: 'image/svg+xml' | 'application/json; charset=UTF-8' } = {}) => {
		if (typeof status === 'number') {
			assertEquals(response.status, status);
		}

		if (typeof contentType === 'string') {
			assertEquals(response.headers.get('Content-Type'), contentType);
		}

		return response;
	};
};

Deno.test('/hit/hiiiits/hiiiits', async () => {
	const response = (await request(`/hit/hiiiits/hiiiits`))({ status: 200, contentType: 'image/svg+xml' });
	assertEquals(
		await response.text(),
		`<svg xmlns="http://www.w3.org/2000/svg" height="1" width="100%"><line x1="0" y1="0" x2="100%" y2="0" stroke="#FFE629" stroke-width="1" /></svg>`,
	);
});

Deno.test('/', async () => {
	const response = (await request(`/`))({ status: 200, contentType: 'application/json; charset=UTF-8' });
	assertEquals(await response.json(), { name: 'hiiiits' });
});

Deno.test('/404', async () => {
	const response = (await request(`/404`))({ status: 404, contentType: 'application/json; charset=UTF-8' });
	assertEquals(await response.json(), { message: 'Not found' });
});
