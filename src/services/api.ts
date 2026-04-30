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

export namespace fetchCheckedIn {
	export interface CheckInLog {
		wasCheckedIn: boolean;
		date: string;
		profile: {
			id: string;
			name: string;
		};
	}

	export interface Response {
		checkInLogs: CheckInLog[];
	}
}

export async function fetchCheckedIn(): Promise<fetchCheckedIn.CheckInLog[]> {
	const toDate = new Date();
	const fromDate = new Date(toDate);
	fromDate.setDate(fromDate.getDate() - 10);

	const params = new URLSearchParams({
		fromDate: fromDate.toJSON(),
		toDate: toDate.toJSON(),
	});

	const res = await fetch(`${API}/checkInLogs?${params}`, {
		headers: apiHeaders(),
	});
	if (!res.ok) return [];
	const { checkInLogs }: fetchCheckedIn.Response = await res.json();

	const activity: Record<string, fetchCheckedIn.CheckInLog> = {};

	for (const log of checkInLogs) {
		const { id } = log.profile;
		const existing = activity[id];
		if (existing && existing.date > log.date) continue;
		activity[id] = log;
	}

	return Object.values(activity).sort((a, b) => a.date < b.date ? 1 : -1);
}

export async function fetchProfileCheckedIn(
	profileId: string,
): Promise<boolean> {
	const toDate = new Date();
	const fromDate = new Date(toDate);
	fromDate.setDate(fromDate.getDate() - 10);

	const params = new URLSearchParams({
		profile: profileId,
		limit: '1',
		fromDate: fromDate.toJSON(),
		toDate: toDate.toJSON(),
	});

	const res = await fetch(`${API}/checkInLogs?${params}`, {
		headers: apiHeaders(),
	});
	if (!res.ok) return false;
	const { checkInLogs }: fetchCheckedIn.Response = await res.json();
	return checkInLogs?.[0]?.wasCheckedIn === true;
}

export async function postCheckOut(
	profileId: string,
): Promise<boolean> {
	const res = await fetch(`${API}/checkInLogs`, {
		method: 'POST',
		headers: apiHeaders({ 'Content-Type': 'application/json' }),
		body: JSON.stringify({
			profileId,
			reason: 'Manual check-out',
			type: 'front-desk',
			wasCheckedIn: false,
		}),
	});
	return res.ok;
}
