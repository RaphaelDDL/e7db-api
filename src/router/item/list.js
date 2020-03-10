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
		const collection = Database.getCollection(`materials_${requestedLanguage}`);

		if (!collection || !requestedLanguage) {
			throw new Error('!collection || !requestedLanguage');
		}

		const itemList = await collection
			.aggregate([
				{
					$project: {
						request_count: 0,
						support_count: 0,
					},
				},
			])
			.sort({
				name: 1,
				type1: 1,
				type2: 1,
			})
			.toArray();

		if (itemList && itemList.length) {
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, itemList);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
