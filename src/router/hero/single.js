import Database from '../../db';
import { MESSAGES } from '../../utils/Constants';
import {
	mountApiErrorResponse,
	mountApiResponse,
	getCurrentLanguage,
	nodeTimer,
	preCalcStatus,
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
				// { $match: { _id } },

				// _id (name-of-hero) or id (c####) or name (Name of Hero)
				{
					$or: [{ $match: { _id } }, { $match: { id: _id } }, { $match: { name: _id } }],
				},
				{ $limit: 1 },
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

				// adding ex_equip data if available
				{
					$lookup: {
						from: `ex_equip-${requestedLanguage}`,
						localField: 'id',
						foreignField: 'unit',
						as: 'ex_equip',
					},
				},

				// looking up zodiac_tree cost items
				{ $unwind: '$zodiac_tree' },
				{ $unwind: '$zodiac_tree.costs' },
				{
					$lookup: {
						from: `materials-${requestedLanguage}`,
						localField: 'zodiac_tree.costs.item',
						foreignField: 'identifier',
						as: 'convertedItems',
					},
				},
				{
					$group: {
						_id: '$zodiac_tree._id',
						root: { $first: '$$ROOT' },
						items: {
							$push: {
								$mergeObjects: ['$zodiac_tree.costs', { $arrayElemAt: ['$convertedItems', 0] }],
							},
						},
					},
				},
				{ $addFields: { 'root.zodiac_tree.costs': '$items' } },
				{ $replaceRoot: { newRoot: '$root' } },
				{ $sort: { 'zodiac_tree._id': 1 } },
				{
					$group: {
						_id: '$_id',
						root: { $first: '$$ROOT' },
						zodiac_tree: { $push: '$zodiac_tree' },
					},
				},
				{ $addFields: { 'root.zodiac_tree': '$zodiac_tree' } },
				{ $replaceRoot: { newRoot: '$root' } },
				{ $project: { convertedItems: 0 } },

				// looking up skills enhancements cost items
				{ $unwind: '$skills' },
				{ $unwind: '$skills.enhancements' },
				{ $unwind: '$skills.enhancements.costs' },
				{
					$lookup: {
						from: `materials-${requestedLanguage}`,
						localField: 'skills.enhancements.costs.item',
						foreignField: 'identifier',
						as: 'convertedSkillCostItems',
					},
				},
				{
					$group: {
						_id: '$skills.enhancements._id',
						root: { $first: '$$ROOT' },
						skEnhCosts: {
							$push: {
								$mergeObjects: [
									'$skills.enhancements.costs',
									{ $arrayElemAt: ['$convertedSkillCostItems', 0] },
								],
							},
						},
					},
				},
				{ $addFields: { 'root.skills.enhancements.costs': '$skEnhCosts' } },
				{ $replaceRoot: { newRoot: '$root' } },
				{ $sort: { 'skills.enhancements._id': 1 } },

				{
					$group: {
						_id: '$skills._id',
						root: { $first: '$$ROOT' },
						skEnh: { $push: '$skills.enhancements' },
					},
				},
				{ $addFields: { 'root.skills.enhancements': '$skEnh' } },
				{ $replaceRoot: { newRoot: '$root' } },
				{ $sort: { 'skills._id': 1 } },
				{
					$group: {
						_id: '$_id',
						root: { $first: '$$ROOT' },
						skills: { $push: '$skills' },
					},
				},
				{ $addFields: { 'root.skills': '$skills' } },
				{ $replaceRoot: { newRoot: '$root' } },
				{ $project: { convertedSkillCostItems: 0 } },
			])
			.toArray();

		if (heroDetail && heroDetail.length) {
			preCalcStatus(heroDetail[0]);
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, heroDetail);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
