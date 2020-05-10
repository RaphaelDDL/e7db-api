import Database from '../../db';
import { MESSAGES } from '../../utils/Constants';
import {
	mountApiErrorResponse,
	mountApiResponse,
	getCurrentLanguage,
	nodeTimer,
	asyncRoute,
} from '../../utils/Utility';

export default asyncRoute(async (req, res, next) => {
	const TIME_START = nodeTimer();
	const { _id } = req.params;

	try {
		const requestedLanguage = getCurrentLanguage(req);
		const collection = Database.getCollection('artifact', requestedLanguage);

		if (!collection || !requestedLanguage || !_id) {
			throw new Error('!collection || !requestedLanguage || !_id');
		}

		const artifactDetail = await collection
			.aggregate([
                /* { $match: { _id } }, */
				// _id (name-of-artifact) or id (e####)
                {
					$match: {
						$or: [{ _id }, { identifier: _id }],
					},
				},
				{ $limit: 1 },
			])
			.toArray();

		if (artifactDetail?.length) {
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, artifactDetail);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
