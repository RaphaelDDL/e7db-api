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
	const TIME_START = process.hrtime();

	try {
		const requestedLanguage = getCurrentLanguage(req);
		const collection = Database.getCollection(`artifact_${requestedLanguage}`);

		if (!collection || !requestedLanguage) {
			throw new Error('!collection || !requestedLanguage');
		}

		const artifactList = await collection
			.aggregate([
				{
					$project: { _id: 1, identifier: 1, name: 1, rarity: 1, role: 1, assets: 1 },
				},
			])
			.sort({
				rarity: -1,
				_id: 1,
			})
			.toArray();

		if (artifactList && artifactList.length) {
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, artifactList);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
