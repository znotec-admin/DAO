import mongoose from 'mongoose';

const MONGO_OPTIONS = {
	serverSelectionTimeoutMS: 5000,
	socketTimeoutMS: 45000,
};

type CachedMongo = {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
};

declare global {
	// eslint-disable-next-line no-var
	var mongoose: CachedMongo | undefined;
}

let cached = global.mongoose;

if (!cached) {
	cached = global.mongoose = { conn: null, promise: null };
}

const connectMongo = async () => {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		cached.promise = mongoose
			.connect(process.env.MONGO_URI as string, MONGO_OPTIONS)
			.then((mongooseInstance) => mongooseInstance);
	}

	try {
		cached.conn = await cached.promise;
	} catch (error) {
		cached.promise = null;
		throw error;
	}

	return cached.conn;
};

export default connectMongo;
