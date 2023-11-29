import { Hono, HTTPException } from 'hono/mod.ts';
import { compress, cors, secureHeaders } from 'hono/middleware.ts';

const app = new Hono().use('*', cors({ origin: '*' }), compress(), secureHeaders({ crossOriginResourcePolicy: false }));

app.get('/hit/:u/:r', (ctx) => {
	return ctx.body(
		`<svg xmlns="http://www.w3.org/2000/svg" height="1" width="100%"><line x1="0" y1="0" x2="100%" y2="0" stroke="#FFE629" stroke-width="1" /></svg>`,
		200,
		{ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate' },
	);
});

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
