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
	const { _id } = req.params;

	try {
		const requestedLanguage = getCurrentLanguage(req);
		const collection = Database.getCollection('ex_equip', requestedLanguage);

		if (!collection || !requestedLanguage || !_id) {
			throw new Error('!collection || !requestedLanguage || !_id');
		}

		const exEquipDetail = await collection
			.aggregate([
				{ $match: { _id } },
				{
					$lookup: {
						from: `hero-${requestedLanguage}`,
						let: { unit: '$unit' },
						pipeline: [
							{ $match: { $expr: { $eq: ['$id', '$$unit'] } } },
							{
								$project: {
									_id: 1,
									id: 1,
									name: 1,
									rarity: 1,
									attribute: 1,
									role: 1,
									zodiac: 1,
								},
							},
						],
						as: 'unit',
					},
				},
				{
					$addFields: {
						unit: {
							$arrayElemAt: ['$unit', 0],
						},
					},
				},
			])
			.sort({
				rarity: -1,
				_id: 1,
			})
			.toArray();

		if (exEquipDetail && exEquipDetail.length) {
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, exEquipDetail);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
