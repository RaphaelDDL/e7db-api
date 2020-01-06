import path from 'path';
const { version } = require(path.resolve(process.cwd(), 'package.json'));
export const VERSION = version;

//* ------------------------
// Section: Database Related
//------------------------ */
export const DB = {
	name: process.env.E7DB_ATLAS_DB || '',
	url: process.env.E7DB_ATLAS_URI || '',
};

//* ------------------------
// Section: Request Headers Related
//------------------------ */
export const HEADERS = {
	authentication: { key: 'x-e7db-auth-key', value: process?.env?.E7DB_AUTH_KEY },
	html: {
		'Content-Type': 'text/html',
	},
	json: {
		'Content-Type': 'application/json',
		Pragma: 'no-cache',
		'Cache-Control': 'max-age=0,no-cache,no-store,post-check=0,pre-check=0',
		Expires: 0,

		//CORS - https://enable-cors.org/server_expressjs.html
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
	},
};

//* ------------------------
// Section: Messaging Related
//------------------------ */
const dbPrefix = 'DB:';
export const MESSAGES = {
	apiLoggerPrefix: '| ==========================================\n| E7DB-API:',
	db: {
		noTable: `${dbPrefix}Invalid resource.`,
		dbConnectionServer: `${dbPrefix} Connection error, server not started`,
		dbConnectionQuery: `${dbPrefix} Connection error, please try again later or open an issue on Github if this keeps happening.`,
	},
	server: {
		start: `Server started on port`,
		notFound: {
			title: '404 - Not Found',
			message: 'Route not found',
		},
		error: {
			title: '500 - Server Error',
		},
	},
	query: {
		invalid: 'Invalid request. Please read the API docs. Open an issue on Github if this keeps happening.',
		limitExceeded: 'Too many requests, please try again soon.',
	},
};
