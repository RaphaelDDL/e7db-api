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
		const collection = Database.getCollection('rankings');

		if (!collection || !requestedLanguage) {
			throw new Error('!collection || !requestedLanguage');
		}

		const rankList = await collection
			.aggregate([
				{
					$lookup: {
						from: `hero_${requestedLanguage}`,
						localField: 'units.character_number',
						foreignField: 'id',
						as: 'team',
					},
				},
				{
					$project: {
						player: 1,
						score: 1,
						league: 1,
						rank: 1,
						border: 1,
						'team._id': 1,
						'team.id': 1,
						'team.name': 1,
						'team.moonlight': 1,
						'team.rarity': 1,
						'team.attribute': 1,
						'team.role': 1,
					},
				},
			])
			.sort({
				rank: 1,
			})
			.toArray();

		if (rankList && rankList.length) {
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, rankList);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
