function update() {
	if (window.location.pathname !== '/admin/people/members') return;

	const urlParams = new URLSearchParams(window.location.search);
	const queryValue = urlParams.get('_q');
	if (!queryValue) return;

	const input = document.querySelector(
		'input.Input-search[ng-model*="search"]',
	);
	if (!input) return;

	input.setAttribute('value', queryValue);
	input.dispatchEvent(new Event('input', { bubbles: true }));
	input.dispatchEvent(new Event('change', { bubbles: true }));

	// Clean up
	urlParams.delete('_q');
	const newQueryString = urlParams.toString();
	const cleanUrl = window.location.pathname +
		(newQueryString ? '?' + newQueryString : '') + window.location.hash;
	window.history.replaceState({}, document.title, cleanUrl);
}

export async function initSearchField() {
	let lastUrl = '';
	const observer = new MutationObserver(() => {
		if (location.href !== lastUrl) {
			lastUrl = location.href;
			update();
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
	update();
}
