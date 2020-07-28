import dateFormat from 'dateformat';
import { VERSION, MESSAGES, HEADERS } from './Constants';

//* ------------------------
// Section: Routes Related
//------------------------ */
export const asyncRoute = (fn) => (req, res, next) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

export const asyncErrorRoute = (fn) => (err, req, res, next) => {
	Promise.resolve(fn(err, req, res, next)).catch(next);
};

export const mountApiErrorResponse = (res, error = MESSAGES.query.invalid, stack = '') => {
	return res
		.status(418) //Just a joke :) See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418
		.set(HEADERS.json)
		.json({
			error,
			stack,
			meta: getResponseMeta(),
		});
};

export const mountApiResponse = (queryCursor, res, err, dbResults = []) => {
	if (queryCursor && queryCursor.close) {
		queryCursor.close();
	}

	if (err) {
		return mountApiErrorResponse(res, MESSAGES.db.dbConnectionQuery, err);
	}

	return res
		.status(200)
		.set(HEADERS.json)
		.json({
			results: dbResults,
			meta: getResponseMeta(),
		});
};

//* ------------------------
// Section: Database Related
//------------------------ */
export const getCurrentLanguage = (req) => {
	let { lang: requestedLanguage = req.get('x-e7db-lang') || 'en' } = req.query;
	if (
		requestedLanguage === 'en' ||
		!['es', 'pt', 'fr', 'ja', 'jp', 'kr', 'ko', 'de', 'zht','tw', 'cn'].includes(requestedLanguage)
	) {
		return 'en';
	}
	switch (requestedLanguage) {
		case 'tw':
			requestedLanguage = 'zht';
		case 'cn':
			requestedLanguage = 'zhs';
			break;
		case 'ko':
			requestedLanguage = 'kr';
			break;
		case 'jp':
			requestedLanguage = 'ja';
			break;
		default:
			break;
	}
	return requestedLanguage;
};

//* ------------------------
// Section:General Utility Related
//------------------------ */
export const getDateNow = () => {
	return dateFormat(new Date(), 'ddd mmm dd HH:MM:ss Z yyyy', true);
};

export const getResponseMeta = () => {
	return {
		requestDate: getDateNow(),
		apiVersion: VERSION,
	};
};

export const cLog = (logLevel = 'log', ...messages) => {
	return console[logLevel](MESSAGES.apiLoggerPrefix, ...messages); // eslint-disable-line no-console
};

export function haltOnTimedout(req, res, next) {
	if (!req.timedout) next();
}
// https://gist.github.com/nikolas/96586a0b56f53eabfd6fe4ed59fecb98
export function shuffleArray(array) {
	const a = array.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

// https://stackoverflow.com/a/39514270
export function assignDefined(target, ...sources) {
	for (const source of sources) {
		for (const key of Object.keys(source)) {
			const val = source[key];
			if (val !== undefined || val !== '' || val !== null) {
				target[key] = val;
			}
		}
	}
	return target;
}

export function nodeTimer(startedAt) {
	if (process?.env?.NODE_ENV === 'production') {
		return;
	}
	if (!startedAt) {
		return process.hrtime();
	}
	const TIME_END = process.hrtime(startedAt);
	console.info('Execution time (hr): %ds %dms', TIME_END[0], TIME_END[1] / 1000000);
}

// BASE FORMULA:
// HP: `(50 + INT * 1.4) * (LEVEL / 3 + 1) * (1 + (GRADE - 1) * 0.075)`
// ATK: `(BRA * 0.6 * (LEVEL / 6 + 1) * (1 + (GRADE - 1) * 0.075)`
// DEF: `(30 + FAI* 0.3) * (LEVEL / 8 + 1) * (1 + (GRADE - 1) * 0.075)`
// SPD: `60 + DES / 1.6`
// EFF: `0`
// EFR: `0`
// CHC: `0.15`
// CHD: `1.5`
// DAC: `0.05`
// CP:  `((att * 1.6 + att * 1.6 * chc * chd) * (1 + (spd - 45) * 0.02) + hp + def * 9.3) * (1 + (res + eff) / 4)`
export function preCalcStatus(currentHero) {
	const {
		stats: { bra, int, fai, des },
		zodiac_tree,
	} = currentHero;
	const statsToFloor = ['hp', 'atk', 'def', 'spd'];

	function calcCP(obj) {
		return Math.floor(
			((obj.atk * 1.6 + obj.atk * 1.6 * obj.chc * obj.chd) * (1 + (obj.spd - 45) * 0.02) +
				obj.hp +
				obj.def * 9.3) *
				(1 + (obj.efr + obj.eff) / 4)
		);
	}

	function calcBaseValues(LEVEL, GRADE = 6) {
		const baseObject = {
			cp: 0,
			atk: bra * 0.6 * (LEVEL / 6 + 1) * (1 + (GRADE - 1) * 0.075),
			hp: (50 + int * 1.4) * (LEVEL / 3 + 1) * (1 + (GRADE - 1) * 0.075),
			spd: 60 + des / 1.6,
			def: (30 + fai * 0.3) * (LEVEL / 8 + 1) * (1 + (GRADE - 1) * 0.075),
			chc: 0.15,
			chd: 1.5,
			dac: 0.05,
			eff: 0,
			efr: 0,
		};
		// Flooring stats
		statsToFloor.forEach((property) => (baseObject[property] = Math.floor(baseObject[property])));
		baseObject.cp = calcCP(baseObject);
		return baseObject;
	}

	function calcZodiacUpgrades(NoAwakensObject, GRADE = 6) {
		let baseAwakenedObject = { ...NoAwakensObject };
		const numberOfPops = 6 - GRADE;
		const copyOfZodiac = [...zodiac_tree];

		for (let index = 0; index < numberOfPops; index++) {
			copyOfZodiac.pop();
		}

		let zodiacStatuses = copyOfZodiac.reduce((prev, curr, i) => {
			return prev.concat(curr.stats);
		}, []);

		let zodiacAwakenBoost = {
			hp_rate: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'max_hp_rate' ? prev + curr.value : prev), 0),
			atk_rate: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'att_rate' ? prev + curr.value : prev), 0),
			def_rate: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'def_rate' ? prev + curr.value : prev), 0),
			hp: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'max_hp' ? prev + curr.value : prev), 0),
			atk: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'att' ? prev + curr.value : prev), 0),
			def: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'def' ? prev + curr.value : prev), 0),
			spd: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'speed' ? prev + curr.value : prev), 0),
			eff: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'acc' ? prev + curr.value : prev), 0),
			efr: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'res' ? prev + curr.value : prev), 0),
			chc: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'cri' ? prev + curr.value : prev), 0),
			chd: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'cri_dmg' ? prev + curr.value : prev), 0),
			dac: zodiacStatuses.reduce((prev, curr) => (curr.stat === 'coop' ? prev + curr.value : prev), 0),
		};

		// applying rates
		baseAwakenedObject.hp = baseAwakenedObject.hp * (1 + zodiacAwakenBoost.hp_rate) + zodiacAwakenBoost.hp;
		baseAwakenedObject.atk = baseAwakenedObject.atk * (1 + zodiacAwakenBoost.atk_rate) + zodiacAwakenBoost.atk;
		baseAwakenedObject.def = baseAwakenedObject.def * (1 + zodiacAwakenBoost.def_rate) + zodiacAwakenBoost.def;
		baseAwakenedObject.spd = baseAwakenedObject.spd + zodiacAwakenBoost.spd;
		baseAwakenedObject.eff = baseAwakenedObject.eff + zodiacAwakenBoost.eff;
		baseAwakenedObject.efr = baseAwakenedObject.efr + zodiacAwakenBoost.efr;
		baseAwakenedObject.chc = baseAwakenedObject.chc + zodiacAwakenBoost.chc;
		baseAwakenedObject.chd = baseAwakenedObject.chd + zodiacAwakenBoost.chd;
		baseAwakenedObject.dac = baseAwakenedObject.dac + zodiacAwakenBoost.dac;

		// Flooring stats
		statsToFloor.forEach((property) => (baseAwakenedObject[property] = Math.floor(baseAwakenedObject[property])));
		baseAwakenedObject.cp = calcCP(baseAwakenedObject);
		return baseAwakenedObject;
	}

	let lv50FiveStarNoAwaken = calcBaseValues(50, 5);
	let lv60SixStarNoAwaken = calcBaseValues(60, 6);
	let lv50FiveStarFullyAwakened = calcZodiacUpgrades(lv50FiveStarNoAwaken, 5);
	let lv60SixStarFullyAwakened = calcZodiacUpgrades(lv60SixStarNoAwaken);

	currentHero.calculatedStatus = {
		lv50FiveStarNoAwaken,
		lv50FiveStarFullyAwakened,
		lv60SixStarNoAwaken,
		lv60SixStarFullyAwakened,
	};
	return currentHero;
}
