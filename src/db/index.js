import { MongoClient } from 'mongodb';
import { DB } from '../utils/Constants';
import { cLog } from '../utils/Utility';

class Database {
	constructor() {
		this.mongoClient = {};
		this.mongoClientDb = {};
		this.collectionHash = 'N/A';
		Object.seal(this);
	}

	get client() {
		return this.mongoClient;
	}
	get db() {
		return this.mongoClientDb;
	}
	get hash() {
		return this.collectionHash;
	}

	set client(client) {
		return (this.mongoClient = client);
	}
	set db(db) {
		return (this.mongoClientDb = db);
	}
	set hash(hash) {
		return (this.collectionHash = hash);
	}

	getCollection(collectionName, lang) {
		return this?.db?.collection(lang ? `${collectionName}-${lang}` : collectionName);
	}

	async processHashes() {
		cLog('log', 'Processing hashes for DB');
		try {
			const hashes = await this?.db?.command({ dbHash: 1, collections: ['hero-en', 'artifact-en'] });
			this.hash = hashes?.md5 ?? this.hash;
			return hashes;
		} catch (error) {
			cLog('error', `Error processing hashes: ${error?.message}`);
		}
	}

	connect() {
		return MongoClient.connect(DB.url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			// autoReconnect: true,
			// reconnectTries: 100,
			// reconnectInterval: 5000, //ms
		})
			.then((client) => {
				this.client = client;
				this.db = this.client.db(DB.name);
			})
			.catch((err = '') => {
				throw new Error(err);
			});
	}
}

export default new Database();
