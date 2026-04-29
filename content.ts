import { fetchOrg, getOrg } from './src/services/api.ts';
import { initProfileCheckout } from './src/profileCheckout.ts';

async function main(): Promise<void> {
	await fetchOrg(false);
	const { name } = getOrg();
	console.log(`HelloClub Plus: ${name}`);

	initProfileCheckout();
}

main();
