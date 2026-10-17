const OFFSCREEN_PATH = 'offscreen.html';

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
		justification: 'Connecting to optional badge scanner',
	});
}

chrome.runtime.onMessage.addListener((data, sender) => {
	console.log(data, sender);
});

chrome.runtime.onStartup.addListener(() => {
	mountOffscreen().catch(console.error);
});
chrome.runtime.onInstalled.addListener(() => {
	mountOffscreen().catch(console.error);
});
