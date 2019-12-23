import Server from './server';
import Database from './db';
import Router from './router';
import Documentation from './documentation';
import { cLog } from './utils/Utility';

const server = new Server({
	Database,
});
const { app } = server;

//* ------------------------
// Server Error Handling
//------------------------ */
const serverShutdown = (exitCode = 1) => {
	return Database.client && Database.client.close
		? Database.client.close(true, () => process.exit(exitCode))
		: process.exit(exitCode);
};

//catch for unhandledRejection so we close db conn and kill server
//Unhandled Promise Rejections, mostly.
process.on('unhandledRejection', (error) => {
	cLog(
		'error',
		`| ==========================================
| unhandledRejection: Please fix me -> ${error.message})
Killing the DB Connection and Node Server`
	);
	serverShutdown();
});

process.on('SIGINT', () => {
	cLog('log', 'Shuting down the server gracefully');
	serverShutdown(0);
});

process.on('SIGTERM', () => {
	cLog('log', 'Kill it with fire');
	serverShutdown();
});

//* ------------------------
// API Routes
//------------------------ */
Router(app);
// Swagger
Documentation(app);

// ------------------------
server.start();
