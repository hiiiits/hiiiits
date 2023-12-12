import { assertEquals } from 'std/assert/mod.ts';
import { FakeTime } from 'std/testing/time.ts';

import app from '~/app.ts';
import type * as Types from '~/types.ts';
import * as svg from '~/svg.ts';

const kv = await Deno.openKv();

const request = async (input: RequestInfo | URL, requestInit: RequestInit = {}) => {
	const response = await app.request(input, { headers: { 'User-Agent': 'github-camo' }, ...requestInit });
	return ({ status, headers }: {
		status?: number;
		headers?: {
			'Content-Type'?: 'image/svg+xml' | 'application/json; charset=UTF-8';
		} & { [key: string]: unknown };
	} = {}) => {
		if (typeof status === 'number') {
			assertEquals(response.status, status);
		}

		if (typeof headers === 'object') {
			for (const key in headers) {
				assertEquals(response.headers.get(key), headers[key]);
			}
		}

		return response;
	};
};

const validValue = (value: unknown) => {
	assertEquals(Array.isArray(value), true);
	assertEquals((value as unknown[]).length, 5);
	type UnknownTuple = [unknown, unknown, unknown, unknown, unknown];
	assertEquals(typeof (value as UnknownTuple)[0], 'number');
	assertEquals(typeof (value as UnknownTuple)[1], 'object');
	assertEquals(typeof (value as UnknownTuple)[2], 'object');
	assertEquals(typeof (value as UnknownTuple)[3], 'object');
	assertEquals(Array.isArray((value as UnknownTuple)[4]), true);
	return value as Types.Value;
};

const api = {
	hit: async (username: string, repository: string) => {
		assertEquals(
			await ((await request(`/hit/${username}/${repository}`))({
				status: 200,
				headers: {
					'Content-Type': 'image/svg+xml',
				},
			})).text(),
			svg.success,
		);
	},
	'~': {
		counts: (username: string) => {
			return async (json: Record<string, number>) => {
				assertEquals(
					await ((await request(`/~/counts/${username}`))({
						status: 200,
						headers: {
							'Content-Type': 'application/json; charset=UTF-8',
						},
					})).json(),
					json,
				);
			};
		},
		value: (username: string, repository: string) => {
			return async (options: { total: number; yearlySize: number; monthlySize: number; dailySize: number; timestampsLength: number }) => {
				const value = validValue(
					await ((await request(`/~/value/${username}/${repository}`))({
						status: 200,
						headers: {
							'Content-Type': 'application/json; charset=UTF-8',
						},
					})).json(),
				);

				const [total, yearly, monthly, daily, timestamps] = value;

				assertEquals(total, options.total);
				assertEquals(Object.keys(yearly).length, options.yearlySize);
				assertEquals(Object.keys(monthly).length, options.monthlySize);
				assertEquals(Object.keys(daily).length, options.dailySize);
				assertEquals(timestamps.length, options.timestampsLength);
			};
		},
		delete: async (username: string, repository: string) => {
			assertEquals(
				await ((await request(`/~/delete/${username}/${repository}`, { method: 'DELETE' }))({
					status: 200,
					headers: {
						'Content-Type': 'application/json; charset=UTF-8',
					},
				})).json(),
				{ message: 'deleted' },
			);
		},
	},
};

Deno.test('/works', async () => {
	for await (const { key } of kv.list({ prefix: ['hiiiits'] })) await kv.delete(key);

	await api['~'].counts('hiiiits')({});

	await api.hit('hiiiits', 'hiiiits');

	await api['~'].counts('hiiiits')({
		['hiiiits']: 1,
	});

	await api.hit('hiiiits', 'dash');
	await api.hit('hiiiits', 'deno');
	await api.hit('hiiiits', 'hiiiits');

	await api['~'].counts('hiiiits')({
		['hiiiits']: 2,
		['dash']: 1,
		['deno']: 1,
	});

	await api.hit('hiiiits', 'hiiiits');
	await api['~'].delete('hiiiits', 'dash');
	await api['~'].delete('hiiiits', 'deno');

	await api['~'].counts('hiiiits')({
		['hiiiits']: 3,
	});

	await api['~'].delete('hiiiits', 'dash');
	await api['~'].delete('hiiiits', 'hiiiits');

	let ft = new FakeTime();

	const tickHourly = () => ft.tick(3_600_000);
	const tickDaily = () => ft.tick(86_400_000);
	const tickMonthly = () => ft.tick(2_592_000_000);

	try {
		await api.hit('hiiiits', 'hiiiits');

		for (let i = 0; i < 24; i++) {
			tickHourly();
			await api.hit('hiiiits', 'hiiiits');
		}
		await api['~'].value('hiiiits', 'hiiiits')({
			total: 25,
			yearlySize: 1,
			monthlySize: 1,
			dailySize: 2,
			timestampsLength: 25,
		});
		for (let i = 0; i < 30; i++) {
			tickDaily();
			await api.hit('hiiiits', 'hiiiits');
		}
		await api['~'].value('hiiiits', 'hiiiits')({
			total: 55,
			yearlySize: 2,
			monthlySize: 2,
			dailySize: 32,
			timestampsLength: 55,
		});

		await api['~'].delete('hiiiits', 'hiiiits');

		ft.restore();
		ft = new FakeTime();

		for (let i = 0; i < 1441; i++) {
			tickDaily();
			await api.hit('hiiiits', 'hiiiits');
		}
		await api['~'].value('hiiiits', 'hiiiits')({
			total: 1441,
			yearlySize: 5,
			monthlySize: 48,
			dailySize: 360,
			timestampsLength: 1440,
		});

		for (let i = 0; i < 200; i++) {
			tickMonthly();
			await api.hit('hiiiits', 'hiiiits');
		}
		await api['~'].value('hiiiits', 'hiiiits')({
			total: 1641,
			yearlySize: 10,
			monthlySize: 60,
			dailySize: 12,
			timestampsLength: 1440,
		});
	} finally {
		ft.restore();
	}
});

Deno.test('/', async () => {
	const response = (await request(`/`))({
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=UTF-8',
		},
	});
	assertEquals(await response.json(), { name: 'hiiiits' });
});

Deno.test('/404', async () => {
	const response = (await request(`/404`))({
		status: 404,
		headers: {
			'Content-Type': 'application/json; charset=UTF-8',
		},
	});
	assertEquals(await response.json(), { message: 'Not found' });
});
