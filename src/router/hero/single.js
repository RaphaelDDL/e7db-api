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
				// {
				// 	$lookup: {
				// 		from: `buffs-${requestedLanguage}`,
				// 		localField: 'buffs',
				// 		foreignField: '_id',
				// 		as: 'buffs',
				// 	},
				// },
				// {
				// 	$lookup: {
				// 		from: `buffs-${requestedLanguage}`,
				// 		localField: 'debuffs',
				// 		foreignField: '_id',
				// 		as: 'debuffs',
				// 	},
				// },
				// {
				// 	$lookup: {
				// 		from: `buffs-${requestedLanguage}`,
				// 		localField: 'common',
				// 		foreignField: '_id',
				// 		as: 'common',
				// 	},
				// },
				// converting zodiac_tree/skills enhancements into their data
				// {
				// 	$lookup: {
				// 		from: `materials-${requestedLanguage}`,
				// 		localField: 'zodiac_tree.costs.item',
				// 		foreignField: 'identifier',
				// 		as: 'zodiac_costs_items',
				// 	},
				// },
				// {
				// 	$lookup: {
				// 		from: `materials-${requestedLanguage}`,
				// 		localField: 'skills.enhancements.costs.item',
				// 		foreignField: 'identifier',
				// 		as: 'sk_enhancements_costs_items',
				// 	},
				// },
				// adding ex_equip data if available
				{
					$lookup: {
						from: `ex_equip-${requestedLanguage}`,
						localField: 'id',
						foreignField: 'unit',
						as: 'ex_equip',
					},
				},

				{
					$unwind: '$zodiac_tree',
				},
				{
					$unwind: '$zodiac_tree.costs',
				},
				{
					$lookup: {
						from: `materials-${requestedLanguage}`,
						localField: 'zodiac_tree.costs.item',
						foreignField: '_id',
						as: 'zodiac_costs_items',
					},
				},
				{
					$group: {
						_id: '$zodiac_tree.name',
						root: {
							$first: '$$ROOT',
						},
						items: {
							$push: {
								$mergeObjects: [
									'$zodiac_tree.costs',
									{
										$arrayElemAt: ['$zodiac_costs_items', 0],
									},
								],
							},
						},
					},
				},
				{
					$addFields: {
						'root.zodiac_tree.costs': '$items',
					},
				},
				{
					$replaceRoot: {
						newRoot: '$root',
					},
				},
				{
					$group: {
						_id: '$_id',
						root: {
							$first: '$$ROOT',
						},
						slots: {
							$push: '$costs',
						},
					},
				},
				{
					$addFields: {
						'root.zodiac_tree': '$zodiac_tree',
					},
				},
				{
					$replaceRoot: {
						newRoot: '$root',
					},
				},
				{
					$project: {
						zodiac_costs_items: 0,
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
