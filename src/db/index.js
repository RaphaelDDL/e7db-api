import { MongoClient } from 'mongodb';
import { DB } from '../utils/Constants';

// https://medium.com/@naumanzafarchaudhry/using-mongodb-on-heroku-without-verifying-your-account-9053a8c42e3c
class Database {
	constructor() {
		this.mongoClient = {};
		this.mongoClientDb = {};
		Object.seal(this);
	}

	get client() {
		return this.mongoClient;
	}
	get db() {
		return this.mongoClientDb;
	}

	set client(client) {
		return (this.mongoClient = client);
	}

	set db(db) {
		return (this.mongoClientDb = db);
	}

	getCollection(collectionName) {
		if (typeof this.db.collection !== 'function') {
			return undefined;
		}
		return this.db.collection(collectionName);
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
