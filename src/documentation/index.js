import express from 'express';
import timeout from 'connect-timeout';
import Limiter from '../utils/Limiter';
import { VERSION } from '../utils/Constants';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

let swaggerDocument;

try {
	let fileContents = fs.readFileSync(path.resolve(process.cwd() + '/docs/swagger.yml'), 'utf8');
	swaggerDocument = yaml.safeLoad(fileContents);
} catch (e) {
	console.log(e);
	swaggerDocument = {
		openapi: '3.0.2',
		info: {
			title: 'EpicSevenDB.com API',
			description:
				'Documentation for the E7DB API. If you are seeing this message instead of a proper endpoint documentation, it means Swagger failed to read the documentation file. Please open an [Issue on Github](https://github.com/EpicSevenDB/api/issues) so I can fix this.',
			version: VERSION || '2.?.?',
		},
	};
}

const connectionTimeout = timeout('15s');
const router = express.Router();
const swaggerOpts = {
	swaggerOptions: {
		defaultModelsExpandDepth: -1,
	},
};

router.use('/', connectionTimeout, swaggerUi.serve);
router.get('*', connectionTimeout, swaggerUi.setup(swaggerDocument, swaggerOpts));

export default (app) => {
	app.use('/', Limiter);
	app.use('/', router);
};
