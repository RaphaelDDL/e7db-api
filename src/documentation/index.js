import express from 'express';
import timeout from 'connect-timeout';
import Limiter from '../utils/Limiter';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import yaml from 'js-yaml';

let swaggerDocument;

try {
	let fileContents = fs.readFileSync(__dirname + '/swagger.yml', 'utf8');
	swaggerDocument = yaml.safeLoad(fileContents);
} catch (e) {
    console.log(e);
    // preset so
	swaggerDocument = {
		openapi: '3.0.2',
		info: {
			title: 'EpicSevenDB.com API',
			description:
				'Documentation for the E7DB API. If you are seeing this message instead of a proper endpoint documentation, it means Swagger failed to read the documentation file. Please open an [Issue on Github](https://github.com/EpicSevenDB/api/issues) so I can fix this.',
			version: '2.0.0',
		},
	};
}
const connectionTimeout = timeout('15s');
const router = express.Router();

router.use('/', connectionTimeout, swaggerUi.serve);
router.get('*', connectionTimeout, swaggerUi.setup(swaggerDocument));

export default (app) => {
	app.use('/', Limiter);
	app.use('/', router);
};
