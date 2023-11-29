try {
	const app = (await import('~/app.ts')).default;
	const name = 'hiiiits';
	const port = 8000;
	const hostname = '0.0.0.0';
	Deno.serve({ port, hostname, onListen: () => console.log(`[${name}]: ${hostname}:${port}`) }, app.fetch);
} catch (error) {
	console.error(error);
}
