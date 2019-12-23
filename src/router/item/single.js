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
		const translationCollection = `text_${requestedLanguage}`;
		const collection = Database.getCollection('item', 2);

		if (!collection || !requestedLanguage || !_id) {
			console.log('hue');
			throw new Error('!collection || !requestedLanguage || !_id');
		}

		const itemDetail = await collection
			.aggregate([
				{ $match: { _id } },
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
			.toArray();

		if (itemDetail && itemDetail.length) {
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, itemDetail);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
