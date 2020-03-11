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
		const collection = Database.getCollection('hero', requestedLanguage);

		if (!collection || !requestedLanguage) {
			throw new Error('!collection || !requestedLanguage');
		}

		const heroList = await collection
			.aggregate([
				{
					$project: {
						_id: 1,
						name: 1,
						moonlight: 1,
						rarity: 1,
						attribute: 1,
						role: 1,
						zodiac: 1,
						devotion: { type: 1 },
						self_devotion: { type: 1 },
						buff: 1,
						debuff: 1,
						common: 1,
					},
				},
			])
			.sort({
				rarity: -1,
				_id: 1,
			})
			.toArray();

		if (heroList && heroList.length) {
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, heroList);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
