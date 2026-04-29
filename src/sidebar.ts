const ANCHOR_JQ = '.SideMenuWrapper';
const SIDEBAR_ID = 'hello-plus-sidebar';

const SIDEBAR_STYLES = {
	position: 'fixed',
	top: '0',
	right: '0',
	width: '320px',
	height: '100vh',
	background: 'white',
	boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
	zIndex: '9999',
	transform: 'translateX(100%)',
	transition: 'transform 0.3s ease',
	overflowY: 'auto',
	padding: '16px',
	boxSizing: 'border-box',
};

let currentAnchor: HTMLElement | null = null;
let cleanup = () => undefined;

async function mountSidebar(anchor: HTMLElement): Promise<void> {
	if (document.getElementById(SIDEBAR_ID)) return;

	// Setup cleanup abort controller
	const ctrl = new AbortController();
	cleanup();
	cleanup = () => {
		ctrl.abort();
	};

	const sidebar = document.createElement('div');
	sidebar.id = SIDEBAR_ID;
	Object.assign(sidebar.style, SIDEBAR_STYLES);

	anchor.appendChild(sidebar);
	ctrl.signal.addEventListener('abort', () => {
		sidebar.remove();
	});

	function update() {
		const hidden = anchor.classList.contains('ng-hide');
		sidebar.style.transform = hidden ? 'translateX(100%)' : 'translateX(0)';
	}

	update();

	const attrObserver = new MutationObserver(update);
	attrObserver.observe(anchor, {
		attributes: true,
		attributeFilter: ['class'],
	});

	ctrl.signal.addEventListener('abort', () => {
		attrObserver.disconnect();
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
