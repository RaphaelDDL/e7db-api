import express from 'express';
import timeout from 'connect-timeout';
import Limiter from '../utils/Limiter';
import fetch from 'node-fetch';
import { parse } from 'url';
import { cLog, getDateNow, mountApiErrorResponse, nodeTimer, asyncRoute } from '../utils/Utility';
import { MESSAGES, HEADERS } from '../utils/Constants';

const connectionTimeout = timeout('15s');
const router = express.Router();

router.get(
	'*',
	connectionTimeout,
	asyncRoute(async (req, res, next) => {
		const TIME_START = process.hrtime();
		let { href: requestUrl } = parse(req.originalUrl);
		let requestUrlSplit = requestUrl.split('/api');

		if (requestUrlSplit && requestUrlSplit.length <= 1) {
			return mountApiErrorResponse(res, MESSAGES.query.invalid);
		}

		fetch('https://epicsevendb-apiserver.herokuapp.com/api' + requestUrlSplit[1])
			.then((resp) => resp.json())
			.then(async (json) => {
				nodeTimer(TIME_START);

				return res
					.status(200)
					.set(HEADERS.json)
					.json(json);
			})
			.catch((err) => {
				cLog('error', err);
				return mountApiErrorResponse(res, MESSAGES.query.invalid, err?.message);
			});
	})
);

export default (app) => {
	app.use('/api/', Limiter);
	app.use('/api/', router);
};
