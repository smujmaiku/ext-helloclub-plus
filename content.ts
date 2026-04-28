async function main(): Promise<void> {
	console.log('yo');
}

const _pushState = history.pushState.bind(history);
history.pushState = (...args: Parameters<typeof history.pushState>) => {
	_pushState(...args);
	main();
};

const _replaceState = history.replaceState.bind(history);
history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
	_replaceState(...args);
	main();
};

window.addEventListener('popstate', main);

main();
