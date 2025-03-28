import fs from 'fs/promises';

import { SetupVerifyMessage } from './scripts/functions.js';
import { Server } from './scripts/server.js';
import { EventManager } from './scripts/events.js';

async function main() {
	const rawData = await fs.readFile('./creds.json', 'utf-8');
	const config = JSON.parse(rawData);

	const server = new Server();
	await server.loadConfig(config);
	await server.login();
	await server.init();

	const eventManager = new EventManager();
	eventManager.listen(server);

	await SetupVerifyMessage(server);
	console.log('Mini Ryza is ready!');

	return server;
}

main().catch(console.error);
