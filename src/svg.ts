export const headers = { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate' };

const svg = (stroke: string) =>
	`<svg xmlns="http://www.w3.org/2000/svg" height="1" width="100%"><line x1="0" y1="0" x2="100%" y2="0" stroke="${stroke}" stroke-width="1" /></svg>`;

export const success = svg('#6E6E6E');
export const warning = svg('#FFE629');
export const failure = svg('#E5484D');
