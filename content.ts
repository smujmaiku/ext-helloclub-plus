import { fetchOrg, getOrg } from './src/services/api.ts';

async function main(): Promise<void> {
	await fetchOrg(false);
	const { name } = getOrg();
	console.log(`HelloClub Plus: ${name}`);
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
