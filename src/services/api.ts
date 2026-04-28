import { getOrgId, getProfileId, getToken } from './localstorage.ts';

const API = 'https://api-v2.helloclub.com';
const API_VERSION = '2023-02-28';
const APP_VERSION = 'b47e44e';
let orgConfig: OrgConfig | null = null;

export interface OrgConfig {
	id: string;
	identifier: string;
	name: string;
	shortName: string;
	subdomain: string;
	timezone: string;
	type: string;
}

function apiHeadersMin() {
	const token = getToken();
	const { hostname } = document.location;

	return {
		Accept: 'application/json, text/plain, */*',
		Authorization: token ? `Bearer ${token}` : '',
		'x-api-version': API_VERSION,
		'x-hostname': hostname,
		'x-org-id': getOrgId() || '',
		'x-profile-id': getProfileId() || '',
		'x-version': APP_VERSION,
	};
}

function apiHeaders(
	extra: Record<string, string> = {},
): Record<string, string> {
	const { identifier } = getOrg();

	return {
		...apiHeadersMin(),
		'x-club': identifier,
		...extra,
	};
}

export function getOrg(): OrgConfig {
	if (!orgConfig) throw Error('Org is not loaded');
	return orgConfig;
}

export async function fetchOrg(force = false): Promise<OrgConfig> {
	if (!force && orgConfig) return orgConfig;

	const res = await fetch(`${API}/orgs/${getOrgId()}`, {
		headers: apiHeadersMin(),
	});
	if (!res.ok) throw new Error('Invalid org');
	orgConfig = await res.json();

	return getOrg();
}
