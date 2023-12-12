import { HTTPException } from 'hono/mod.ts';
import type { Context } from 'hono/mod.ts';

import type * as Types from '~/types.ts';
import * as config from '~/config.ts';

const badRequest = (message: string) => new HTTPException(400, { message });

export const secret = (ctx: Context) => {
	if (ctx.req.query('secret') !== Deno.env.get('SECRET')) throw badRequest('Invalid secret');
};

export const userAgent = (ctx: Context) => {
	if (!(ctx.req.header('user-agent')?.toLowerCase().includes('github-camo'))) throw badRequest('Invalid user-agent');
};

const createRegExpValid = (regexp: RegExp, errorMessage: string) => (value: unknown): string => {
	if (typeof value === 'string' && regexp.test(value)) return value;
	throw badRequest(errorMessage);
};

export const validUsername = createRegExpValid(/^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/, 'Invalid username');
export const validRepository = createRegExpValid(/^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,99}$/, 'Invalid repository');

export const createKeyFromParam = <P extends { u: string; r: string }>(param: P): Types.Key => [validUsername(param.u), validRepository(param.r)];

export const filterTimely = (source: Record<string, number>, minTime: number): Record<string, number> => {
	const result: Record<string, number> = {};
	for (const key in source) if (Number(key) > minTime) result[key] = source[key];
	return result;
};

export const sliceTimestamps = (nextTimestamps: number[]): number[] =>
	(nextTimestamps.length > config.MAX_TIMESTAMPS_LENGTH) ? nextTimestamps.slice(0, config.MAX_TIMESTAMPS_LENGTH) : nextTimestamps;
