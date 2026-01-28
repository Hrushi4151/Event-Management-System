import mongoose from 'mongoose';

// const MONGODB_URI = process.env.MONGODB_URI;
// const MONGODB_URI = "mongodb+srv://hrushitech51:eventflow123@cluster0.y2hbeaz.mongodb.net/EventFlow?retryWrites=true&w=majority&appName=Cluster0"
const MONGODB_URI="mongodb+srv://hrushitech51:eventflow123@cluster0.h5dthvq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable inside .env.local"
    );
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const dbconnect = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise =await mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
};

export default dbconnect;
