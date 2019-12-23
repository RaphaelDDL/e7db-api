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
		const translationCollection = `text_${requestedLanguage}`;
		const collection = Database.getCollection('item', 2);

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
				{
					$lookup: {
						from: translationCollection,
						localField: 'name',
						foreignField: '_id',
						as: 'name',
					},
				},
				{
					$unwind: {
						path: '$name',
						preserveNullAndEmptyArrays: true,
					},
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
					$unwind: {
						path: '$description',
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$addFields: {
						description: '$description.text',
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'category',
						foreignField: '_id',
						as: 'category',
					},
				},
				{
					$unwind: {
						path: '$category',
						preserveNullAndEmptyArrays: true,
					},
				},
				{
					$addFields: {
						category: '$category.text',
					},
				},
			])
			.sort({
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
