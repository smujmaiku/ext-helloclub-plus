import z from '@zod/zod';
import { PEERID_KEY } from './src/shared.ts';

const TITLE = 'HelloClub Plus';
const OFFSCREEN_PATH = 'offscreen.html';
const SCAN_EXPIRE_MS = 90_000;

const scanSchema = z.string().min(2).max(16);
const SCAN_INVALID = new Error('Invalid Scan Data');

let status: 'PEER' | 'OPEN' | 'CLOSED' | 'INACTIVE' = 'INACTIVE';
let scanValue: string | Error | undefined = undefined;
let scanExpire = 0;
let scanTimer: NodeJS.Timeout;

function updateIcon() {
	const now = Date.now();
	chrome.action.setTitle({ title: TITLE });

	if (scanValue === SCAN_INVALID) {
		chrome.action.setTitle({ title: `${TITLE} - Invalid Data` });
		chrome.action.setBadgeText({ text: '?' });
		chrome.action.setBadgeBackgroundColor({
			color: now % 300 > 100 ? '#34C' : '#A9E',
		});
	} else if (scanValue) {
		chrome.action.setTitle({ title: `${TITLE} - ${scanValue}` });
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
		chrome.action.setTitle({ title: `${TITLE} - Connecting` });
		chrome.action.setBadgeText({ text: '~' });
		chrome.action.setBadgeBackgroundColor({
			color: '#ED1',
		});
	} else if (status === 'CLOSED') {
		chrome.action.setTitle({ title: `${TITLE} - Offline` });
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

function setScan(value: unknown) {
	clearInterval(scanTimer);
	scanExpire = Date.now() + SCAN_EXPIRE_MS;
	try {
		scanValue = scanSchema.parse(value);
	} catch (_e) {
		scanValue = SCAN_INVALID;
	}

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
		await chrome.offscreen.closeDocument();
		status = 'INACTIVE';
		updateIcon();
	}
	if (!pid) return;

	await chrome.offscreen.createDocument({
		url: offPath,
		reasons: [chrome.offscreen.Reason.WEB_RTC],
		justification: 'Connecting to optional scanValue scanner',
	});
	status = 'CLOSED';
	updateIcon();
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
	if (!tab.id || !tab.url || !scanValue || scanValue instanceof Error) return;
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
