// Import the dependency.
import { mongodb } from '$lib/variables';
import { MongoClient } from 'mongodb';

const uri = mongodb.mongodbUri;

if (!uri) {
  throw new Error('Missing environment variable MONGODB_URI');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let _mongoClientPromise = (global as any)._mongoClientPromise as any;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (hot module replacement).
  if (!_mongoClientPromise) {
    client = new MongoClient(uri);
    _mongoClientPromise = client.connect();
  }

  clientPromise = _mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
