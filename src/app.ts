import { Hono, HTTPException } from 'hono/mod.ts';
import { compress, cors, secureHeaders } from 'hono/middleware.ts';

import dayjs from 'dayjs';
import dayjsPluginUTC from 'dayjs/plugin/utc';

import type * as Types from '~/types.ts';
import * as config from '~/config.ts';
import * as svg from '~/svg.ts';
import * as utils from '~/utils.ts';

dayjs.extend(dayjsPluginUTC);

const kv = await Deno.openKv();

const app = new Hono().use('*', cors({ origin: '*' }), compress(), secureHeaders({ crossOriginResourcePolicy: false }));

app.get('/hit/:u/:r', async (ctx) => {
	let body: string = svg.success;

	try {
		utils.userAgent(ctx);
		const key = utils.createKeyFromParam(ctx.req.param());

		try {
			const [currTotal, currYearly, currMonthly, currDaily, currTimestamps]: Types.Value = (await kv.get<Types.Value>(key)).value ?? [0, {}, {}, {}, []];

			const $dayjs = dayjs.utc(),
				keyYear = `${$dayjs.clone().startOf('y').valueOf()}`,
				keyMonth = `${$dayjs.clone().startOf('M').valueOf()}`,
				keyDay = `${$dayjs.clone().startOf('D').valueOf()}`;

			currYearly[keyYear] = (currYearly[keyYear] ?? 0) + 1, currMonthly[keyMonth] = (currMonthly[keyMonth] ?? 0) + 1, currDaily[keyDay] = (currDaily[keyDay] ?? 0) + 1;

			await kv.set(key, [
				currTotal + 1,
				utils.filterTimely(currYearly, $dayjs.clone().subtract(config.MAX_YEARLY_SIZE, 'years').startOf('D').valueOf()),
				utils.filterTimely(currMonthly, $dayjs.clone().subtract(config.MAX_MONTHLY_SIZE, 'months').startOf('D').valueOf()),
				utils.filterTimely(currDaily, $dayjs.clone().subtract(config.MAX_DAILY_SIZE, 'days').startOf('D').valueOf()),
				utils.sliceTimestamps([$dayjs.valueOf(), ...currTimestamps]),
			]);
		} catch (error) {
			console.error(error), body = svg.failure;
		}
	} catch (error) {
		console.error(error), body = svg.warning;
	}

	return ctx.body(body, 200, svg.headers);
});

app.route(
	'/~',
	new Hono()
		.get('/counts/:u', async (ctx) => {
			const array: ({ k: string; v: number })[] = [];
			for await (const entry of kv.list<Types.Value>({ prefix: [utils.validUsername(ctx.req.param('u'))] })) array.push({ k: (entry.key as Types.Key)[1], v: entry.value[0] });
			array.sort((a, b) => a.v > b.v ? -1 : a.v < b.v ? 1 : a.k > b.k ? -1 : a.k < b.k ? 1 : 0);
			return ctx.json(array.reduce((obj, el) => (obj[el.k] = el.v, obj), {} as Record<string, number>));
		})
		.get('/value/:u/:r', async (ctx) => {
			const { value } = await kv.get<Types.Value>(utils.createKeyFromParam(ctx.req.param()));
			return value ? ctx.json(value) : ctx.notFound();
		})
		.delete('/delete/:u/:r', async (ctx) => {
			utils.secret(ctx);
			await kv.delete(utils.createKeyFromParam(ctx.req.param()));
			return ctx.json({ message: 'deleted' });
		}),
);

app
	.get('/', (ctx) => ctx.json({ name: 'hiiiits' }, 200))
	.notFound((ctx) => ctx.json({ message: 'Not found' }, 404))
	.onError((err, ctx) => {
		if (err instanceof HTTPException) return err.getResponse();
		let message = 'Internal server error';
		if (err instanceof Error) message = err.message;
		return ctx.json({ message }, 500);
	});

export default app;
