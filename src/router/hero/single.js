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
		const translationCollection = `text_${requestedLanguage}`;
		const collection = Database.getCollection('hero', 2);

		if (!collection || !requestedLanguage || !_id) {
			throw new Error('!collection || !requestedLanguage || !_id');
		}

		const heroDetail = await collection
			.aggregate([
				{ $match: { _id } },
				{
					$lookup: {
						from: translationCollection,
						localField: 'name',
						foreignField: '_id',
						as: 'name',
					},
				},
				{
					$unwind: '$name',
				},
				{
					$addFields: {
						name: '$name.text',
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'description',
						foreignField: '_id',
						as: 'description',
					},
				},
				{
					$unwind: '$description',
				},
				{
					$addFields: {
						description: '$description.text',
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'story',
						foreignField: '_id',
						as: 'story',
					},
				},
				{
					$unwind: '$story',
				},
				{
					$addFields: {
						story: '$story.text',
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'get_line',
						foreignField: '_id',
						as: 'get_line',
					},
				},
				{
					$unwind: '$get_line',
				},
				{
					$addFields: {
						get_line: '$get_line.text',
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'specialty.name',
						foreignField: '_id',
						as: 'specialty.name',
					},
				},
				{
					$unwind: '$specialty.name',
				},
				{
					$addFields: {
						specialty: { name: '$specialty.name.text' },
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'specialty.description',
						foreignField: '_id',
						as: 'specialty.description',
					},
				},
				{
					$unwind: '$specialty.description',
				},
				{
					$addFields: {
						specialty: { description: '$specialty.description.text' },
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'specialty.type.name',
						foreignField: '_id',
						as: 'specialty.type.name',
					},
				},
				{
					$unwind: '$specialty.type.name',
				},
				{
					$addFields: {
						specialty: { type: { name: '$specialty.type.name.text' } },
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'specialty.type.description',
						foreignField: '_id',
						as: 'specialty.type.description',
					},
				},
				{
					$unwind: '$specialty.type.description',
				},
				{
					$addFields: {
						specialty: { type: { description: '$specialty.type.description.text' } },
					},
				},

				{
					$lookup: {
						from: translationCollection,
						let: { pid: '$camping.topics' },
						pipeline: [{ $match: { $expr: { $in: ['$_id', '$$pid'] } } }],
						as: 'camping.topics',
					},
				},
				{
					$addFields: {
						camping: { topics: '$camping.topics.text' },
					},
				},
				{
					$lookup: {
						from: translationCollection,
						let: { pid: '$camping.personalities' },
						pipeline: [{ $match: { $expr: { $in: ['$_id', '$$pid'] } } }],
						as: 'camping.personalities',
					},
				},
				{
					$addFields: {
						camping: { personalities: '$camping.personalities.text' },
					},
				},
				{
					$unwind: '$skills',
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'skills.description',
						foreignField: '_id',
						as: 'skills.description',
					},
				},
				{
					$unwind: '$skills.description',
				},
				{
					$addFields: {
						skills: { description: '$skills.description.text' },
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'skills.enhanced_description',
						foreignField: '_id',
						as: 'skills.enhanced_description',
					},
				},
				{
					$unwind: {
						path: '$skills.enhanced_description',
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$addFields: {
						skills: {
							enhanced_description: {
								$ifNull: ['$skills.enhanced_description.text', null],
							},
						},
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'skills.soul_description',
						foreignField: '_id',
						as: 'skills.soul_description',
					},
				},
				{
					$unwind: {
						path: '$skills.soul_description',
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$addFields: {
						skills: {
							soul_description: {
								$ifNull: ['$skills.soul_description.text', null],
							},
						},
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'skills.name',
						foreignField: '_id',
						as: 'skills.name',
					},
				},
				{
					$unwind: '$skills.name',
				},
				{
					$addFields: {
						skills: { name: '$skills.name.text' },
					},
				},
				// {
				// 	$lookup: {
				// 		from: translationCollection,
				// 		let: { pid: '$skills.enhancements' },
				// 		pipeline: [{ $match: { $expr: { $in: ['$_id', '$$pid'] } } }],
				// 		as: 'skills.enhancements',
				// 	},
				// },
				// {
				// 	$lookup: {
				// 		from: translationCollection,
				// 		localField: 'skills.enhancements.string',
				// 		foreignField: '_id',
				// 		as: 'skills.enhancements.string',
				// 	},
				// },
				// {
				// 	$addFields: {
				// 		skills: { enhancements: {string:'$skills.enhancements.string.text'} },
				// 	},
				// },
				{
					$group: {
						_id: '$_id',
						myHero: { $first: '$$ROOT' },
						skills: {
							$push: '$skills',
						},
					},
				},
				{
					$addFields: {
						myHero: {
							skills: '$skills',
						},
					},
				},
				{
					$replaceRoot: { newRoot: '$myHero' },
				},
				// {
				//     $group: {
				//         _id: "$_id",
				//         myHero: { "$first": "$$ROOT" },
				//     }
				// },
				// {
				//     "$replaceRoot": { "newRoot": "$myHero" }
				//   }
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
