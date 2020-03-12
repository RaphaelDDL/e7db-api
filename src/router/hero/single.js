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
		const collection = Database.getCollection('hero', requestedLanguage);

		if (!collection || !requestedLanguage || !_id) {
			throw new Error('!collection || !requestedLanguage || !_id');
		}

		const heroDetail = await collection
			.aggregate([
				{ $match: { _id } },
				// converting buff/debuff/other into their data
				{
					$lookup: {
						from: `buffs-${requestedLanguage}`,
						localField: 'buffs',
						foreignField: '_id',
						as: 'buffs',
					},
				},
				{
					$lookup: {
						from: `buffs-${requestedLanguage}`,
						localField: 'debuffs',
						foreignField: '_id',
						as: 'debuffs',
					},
				},
				{
					$lookup: {
						from: `buffs-${requestedLanguage}`,
						localField: 'common',
						foreignField: '_id',
						as: 'common',
					},
				},
				// {
				// 	$lookup: {
				// 		from: `buffs-${requestedLanguage}`,
				// 		localField: 'skills.buff',
				// 		foreignField: '_id',
				// 		as: 'buffs',
				// 	},
				// },
				{
					$lookup: {
						from: `buffs-${requestedLanguage}`,
						let: { el: '$skills.buff' },
						pipeline: [
							{ $match: { $expr: { $in: ['$_id', '$$el'] } } },
							// {
							//     $project: { loreDescription: 0, skillDescription: 0, stats: 0 },
							// },
						],
						as: '$skills.$[]',
					},
				},
				// adding ex_equip data if available
				{
					$lookup: {
						from: `ex_equip-${requestedLanguage}`,
						localField: 'id',
						foreignField: 'unit',
						as: 'ex_equip',
					},
				},
			])
			.toArray();

		if (heroDetail && heroDetail.length) {
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, heroDetail);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
