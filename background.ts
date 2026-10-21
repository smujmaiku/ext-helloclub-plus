const OFFSCREEN_PATH = 'offscreen.html';

const SCAN_EXPIRE_MS = 90_000;

let status: 'PEER' | 'OPEN' | 'CLOSED' = 'CLOSED';
let scanValue: string | undefined = undefined;
let scanExpire = 0;
let scanTimer: NodeJS.Timeout;

function updateIcon() {
	const now = Date.now();

	if (scanValue) {
		chrome.action.setBadgeText({ text: '🪪' });
		chrome.action.setBadgeBackgroundColor({
			color: now % 200 < 100 ? '#C34' : '#E32',
		});
	} else if (status === 'PEER') {
		chrome.action.setBadgeText({ text: '✓' });
		chrome.action.setBadgeBackgroundColor({
			color: '#3C4',
		});
		// } else if (status === 'OPEN') {
		// 	chrome.action.setBadgeText({ text: '?' });
		// 	chrome.action.setBadgeBackgroundColor({
		// 		color: '#ED1',
		// 	});
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
	const pid = 'badge-plus-change-me';
	const offPath = `${OFFSCREEN_PATH}#${encodeURIComponent(pid)}`;
	const offUrl = chrome.runtime.getURL(offPath);

	const [current] = await chrome.runtime.getContexts({
		contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
	});

	const currentUrl = current?.documentUrl ?? null;
	if (currentUrl === offUrl) return;
	if (currentUrl) await chrome.offscreen.closeDocument();

	await chrome.offscreen.createDocument({
		url: offPath,
		reasons: [chrome.offscreen.Reason.WEB_RTC],
		justification: 'Connecting to optional scanValue scanner',
	});
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
