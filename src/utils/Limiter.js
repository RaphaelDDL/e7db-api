import rateLimit from 'express-rate-limit';
import { MESSAGES, HEADERS } from './Constants';
import { cLog, mountApiErrorResponse } from './Utility';
import { URL } from 'url';

// anti-DDOS
// limit each IP to {max} requests per {windowMs}
export default rateLimit({
	max: 300,
	windowMs: 60 * 1000, // 1 minute
	keyGenerator: (req /*, res */) => {
		let domain = 'no-referer';
		if (req.headers.referer) {
			// spelled wrong per the RFC
			try {
				let refererUrl = '';
				if (req.headers.referer.indexOf('http') === -1) {
					refererUrl = new URL('http://' + req.headers.referer); // this can throw if the header is invalid
				} else {
					refererUrl = new URL(req.headers.referer); // this can throw if the header is invalid
				}
				domain = refererUrl.hostname;
			} catch (err) {
				cLog('warn', `Error parsing referrer ${req.headers.referer} from IP ${req.ip}`, err);
			}
		}
		return `${domain}:${req.ip}`;
	},
	handler: function(req, res /*next*/) {
		return mountApiErrorResponse(res, MESSAGES.query.limitExceeded);
	},
	onLimitReached: function(req, res, options) {
		//log a console with IP
		cLog(
			'warn',
			`WARN: Too many requests to the API coming from IP ${req.ip}. If this message continues for this IP, might be a DDOS attack.`
		);
	},
	skip: function(req, res) {
		const authKeyHeader = req.headers && req.headers[HEADERS.authentication.key];

		if (!authKeyHeader || (HEADERS.authentication.value && authKeyHeader !== HEADERS.authentication.value)) {
			return false;
		}
		return true;
	},
});
