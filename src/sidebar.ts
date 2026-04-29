import { h, render } from 'preact';
import { Sidebar } from './Sidebar.tsx';

const ANCHOR_JQ = '.SideMenuWrapper';
const SIDEBAR_ID = 'hello-plus-sidebar';

let currentAnchor: HTMLElement | null = null;
let cleanup = () => undefined;

function mountSidebar(anchor: HTMLElement): void {
	if (document.getElementById(SIDEBAR_ID)) return;

	const ctrl = new AbortController();
	cleanup();
	cleanup = () => {
		ctrl.abort();
	};

	const root = document.createElement('div');
	root.id = SIDEBAR_ID;
	anchor.appendChild(root);
	render(h(Sidebar, { anchor }), root);

	ctrl.signal.addEventListener('abort', () => {
		render(null, root);
		root.remove();
	});
}

export function initSidebar(): () => void {
	currentAnchor = document.querySelector<HTMLElement>(ANCHOR_JQ);

	const observer = new MutationObserver(() => {
		const anchor = document.querySelector<HTMLElement>(ANCHOR_JQ);
		if (anchor === currentAnchor) return;

		currentAnchor = anchor;

		if (!anchor) return;
		mountSidebar(anchor);
	});

	observer.observe(document.body, { childList: true, subtree: true });

	if (currentAnchor) {
		mountSidebar(currentAnchor);
	}

	return () => {
		observer.disconnect();
		cleanup();
	};
}
