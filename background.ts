import { PEERID_KEY } from './src/shared.ts';

const TITLE = 'HelloClub Plus';
const OFFSCREEN_PATH = 'offscreen.html';
const SCAN_EXPIRE_MS = 90_000;

let status: 'PEER' | 'OPEN' | 'CLOSED' | 'INACTIVE' = 'INACTIVE';
let scanValue: string | undefined = undefined;
let scanExpire = 0;
let scanTimer: NodeJS.Timeout;

function updateIcon() {
	const now = Date.now();
	chrome.action.setTitle({ title: 'HelloClub Plus' });

	if (scanValue) {
		chrome.action.setTitle({ title: 'HelloClub Plus - Data' });
		chrome.action.setBadgeText({ text: '🪪' });
		chrome.action.setBadgeBackgroundColor({
			color: now % 300 > 100 ? '#34C' : '#A9E',
		});
	} else if (status === 'PEER') {
		chrome.action.setBadgeText({ text: '✓' });
		chrome.action.setBadgeBackgroundColor({
			color: '#3C4',
		});
	} else if (status === 'OPEN') {
		chrome.action.setTitle({ title: 'HelloClub Plus - Connecting' });
		chrome.action.setBadgeText({ text: '~' });
		chrome.action.setBadgeBackgroundColor({
			color: '#ED1',
		});
	} else if (status === 'CLOSED') {
		chrome.action.setTitle({ title: 'HelloClub Plus - Offline' });
		chrome.action.setBadgeText({ text: 'x' });
		chrome.action.setBadgeBackgroundColor({
			color: '#C34',
		});
	} else {
		chrome.action.setBadgeText({});
		chrome.action.setBadgeBackgroundColor({
			color: '#000',
		});
	}
}

function setScan(value: string) {
	clearInterval(scanTimer);
	scanExpire = Date.now() + SCAN_EXPIRE_MS;
	scanValue = value;
	scanTimer = setInterval(() => {
		if (Date.now() > scanExpire) {
			clearScan();
			return;
		}
		updateIcon();
	}, 100);
}

function clearScan() {
	clearInterval(scanTimer);
	scanExpire = 0;
	scanValue = undefined;
	updateIcon();
}

async function mountOffscreen(): Promise<void> {
	const { [PEERID_KEY]: pid } = await chrome.storage.local.get([PEERID_KEY])
		.catch(console.error) || {};

	const offPath = `${OFFSCREEN_PATH}#${encodeURIComponent(`${pid}`)}`;
	const offUrl = chrome.runtime.getURL(offPath);

	const [current] = await chrome.runtime.getContexts({
		contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
	});

	const currentUrl = current?.documentUrl ?? null;
	if (currentUrl === offUrl) return;
	if (currentUrl) {
		status = 'INACTIVE';
		await chrome.offscreen.closeDocument();
	}
	if (!pid) return;

	await chrome.offscreen.createDocument({
		url: offPath,
		reasons: [chrome.offscreen.Reason.WEB_RTC],
		justification: 'Connecting to optional scanValue scanner',
	});
	status = 'CLOSED';
}

async function handlePeerData(data: unknown): Promise<void> {
	const { type, payload } = JSON.parse(data as string);
	console.log(type, payload);

	switch (type) {
		case 'scan':
			setScan(payload);
		default:
	}
}

chrome.runtime.onMessage.addListener((data, sender) => {
	console.log(data, sender);
	const { type, payload } = data;
	switch (type) {
		case 'OPEN':
			status = 'OPEN';
			break;
		case 'DISCONNECTED':
			status = 'CLOSED';
			break;
		case 'PEER_CLOSE':
			status = 'OPEN';
			break;
		case 'PEER_OPEN':
			status = 'PEER';
			break;
		case 'PEER_DATA':
			handlePeerData(payload);
			break;
		default:
	}

	updateIcon();
});

chrome.action.onClicked.addListener((tab) => {
	if (!tab.id || !tab.url || !scanValue) return;
	const url = new URL(tab.url);

	const validHost = url.hostname.endsWith('.helloclub.com') &&
		!['www', 'auth'].includes(url.hostname.slice(0, -'.helloclub.com'.length));
	if (!validHost) return;

	chrome.tabs.update(tab.id, {
		url: `https://lmn.helloclub.com/admin/people/members?_q=${scanValue}`,
	}).catch(console.error);

	clearScan();
});

chrome.runtime.onStartup.addListener(() => {
	mountOffscreen().catch(console.error);
});
chrome.runtime.onInstalled.addListener(() => {
	mountOffscreen().catch(console.error);
});
chrome.runtime.onEnabled.addListener(() => {
	mountOffscreen().catch(console.error);
});

chrome.storage.onChanged.addListener(() => {
	mountOffscreen().catch(console.error);
});
