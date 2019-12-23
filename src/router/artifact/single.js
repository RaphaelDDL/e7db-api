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
		const collection = Database.getCollection('artifact', 2);

		if (!collection || !requestedLanguage || !_id) {
			throw new Error('!collection || !requestedLanguage || !_id');
		}

		const artifactDetail = await collection
			.aggregate([
				{ $match: { _id } },
				{ $limit: 1 },
				{
					$lookup: {
						from: translationCollection,
						localField: 'name',
						foreignField: '_id',
						as: 'name',
					},
				},
				{
					$unwind: { path: '$name', preserveNullAndEmptyArrays: true },
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
					$unwind: { path: '$description', preserveNullAndEmptyArrays: true },
				},
				{
					$addFields: {
						description: '$description.text',
					},
				},
				{
					$lookup: {
						from: translationCollection,
						localField: 'skill.description',
						foreignField: '_id',
						as: 'skill.description',
					},
				},
				{
					$unwind: { path: '$skill.description', preserveNullAndEmptyArrays: true },
				},
				{
					$addFields: {
						skill: { description: '$skill.description.text' },
					},
				},
			])
			.toArray();

		if (artifactDetail && artifactDetail.length) {
			nodeTimer(TIME_START);
			return mountApiResponse({}, res, null, artifactDetail);
		}
		return mountApiErrorResponse(res, MESSAGES.query.invalid);
	} catch (error) {
		console.error(JSON.stringify(error, null, 4));
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery);
	}
});
