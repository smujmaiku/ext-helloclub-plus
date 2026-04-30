export function getLocalJson<T>(key: string): T | null {
	try {
		return JSON.parse(localStorage.getItem(key) ?? 'null') as T;
	} catch {
		return null;
	}
}

export function getToken(): string | null {
	return getLocalJson<string>('hc.auth.idToken');
}

export function getOrgId(): string | null {
	return getLocalJson('hc.organisationId');
}

export function getProfileId(): string | null {
	return getLocalJson('hc.profileId');
}
