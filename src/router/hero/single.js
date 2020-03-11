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
				// {
				// 	$lookup: {
				// 		from: `buff_${requestedLanguage}`,
				// 		localField: 'skills.buff',
				// 		foreignField: '_id',
				// 		// as: 'name',
				// 	},
				// },

				// adding ex_equip data if available
				{
					$lookup: {
						from: `ex_equip-${requestedLanguage}`,
						let: { charId: '$id' },
						pipeline: [
							{
								$match: {
									$expr: {
										$cond: [
											{ $eq: [{ $unit: '$$charId' }, 'missing'] },
											{},
											{ $in: ['$id', '$$charId'] },
										],
									},
								},
							},
						],
					},
				},

				// converting buff/debuff/other into their data
				{
					$lookup: {
						from: `buff-${requestedLanguage}`,
						let: { ar: '$skills.buff' },
						pipeline: [
							{
								$match: {
									$expr: {
										$cond: [{ $eq: [{ $type: '$$ar' }, 'missing'] }, {}, { $in: ['$_id', '$$ar'] }],
									},
								},
							},
						],
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
