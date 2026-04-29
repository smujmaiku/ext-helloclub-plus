import { delay } from '@std/async';
import { fetchProfileCheckedIn, postCheckOut } from './services/api.ts';

const TARGET_JQ = '[tooltip="Check member in"]';
const CHECKOUT_ID = 'hello-plus-checkout-btn';
const MEMBERS_EDIT_RX = /\/admin\/people\/members\/edit\/([^/]+)\/?$/;

let currentProfileId: string | undefined;
let currentAnchor: HTMLElement | null = null;
let cleanup = () => undefined;

function getProfileId(): string | undefined {
	const [, id] = location.pathname.match(MEMBERS_EDIT_RX) || [];
	return id;
}

async function mountCheckout(anchor: HTMLElement): Promise<void> {
	const profileId = getProfileId();
	if (!profileId) return;
	if (document.getElementById(CHECKOUT_ID)) return;

	// Setup cleanup abort controller
	const ctrl = new AbortController();
	cleanup();
	cleanup = () => {
		ctrl.abort();
	};

	// Check if we need the button at all
	const checkedIn = await fetchProfileCheckedIn(profileId).catch(() => false);
	if (!checkedIn || ctrl.signal.aborted) return;

	anchor.style.color = 'green';
	ctrl.signal.addEventListener('abort', () => {
		anchor.style.color = '';
	});

	const btn = document.createElement('button');
	btn.id = CHECKOUT_ID;
	btn.innerHTML = '<i class="Icon">logout</i>';
	btn.addEventListener('click', async () => {
		btn.disabled = true;
		btn.innerHTML = '<i class="Icon">hourglass_empty</i>';

		const ok = await postCheckOut(profileId).catch(() => false);
		if (!ok) {
			btn.innerHTML = '<i class="Icon">logout</i>';
			btn.disabled = false;
			return;
		}
		cleanup();
	});

	anchor.insertAdjacentElement('beforebegin', btn);
	ctrl.signal.addEventListener('abort', () => {
		btn.remove();
	});
}

function attachCheckIn(anchor: HTMLElement) {
	if (anchor.dataset.helloPlus) return;

	anchor.dataset.helloPlus = '1';
	anchor.addEventListener('click', async () => {
		await delay(500);
		if (currentAnchor !== anchor) return;
		mountCheckout(anchor);
	});
}

export function initProfileCheckout(): () => void {
	currentProfileId = getProfileId();
	currentAnchor = document.querySelector<HTMLElement>(TARGET_JQ);

	const observer = new MutationObserver(() => {
		const profileId = getProfileId();
		const anchor = document.querySelector<HTMLElement>(TARGET_JQ);
		if (profileId !== currentProfileId || anchor !== currentAnchor) {
			cleanup();
			cleanup = () => undefined;
		}
		currentProfileId = profileId;
		currentAnchor = anchor;

		if (!anchor) return;

		attachCheckIn(anchor);
		mountCheckout(anchor);
	});

	observer.observe(document.body, { childList: true, subtree: true });

	if (currentAnchor) {
		attachCheckIn(currentAnchor);
		mountCheckout(currentAnchor);
	}

	return () => {
		observer.disconnect();
		cleanup();
	};
}
