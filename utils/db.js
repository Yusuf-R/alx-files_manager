/* eslint-disable max-len */

import { MongoClient } from 'mongodb';

// host: from the environment variable DB_HOST or default: localhost
const host = process.env.DB_HOST || 'localhost';
// port: from the environment variable DB_PORT or default: 27017
const port = process.env.DB_PORT || 27017;
// database name: from the environment variable DB_NAME or default: nodeDB
const dbName = process.env.DB_DATABASE || 'files_manager';

const url = `mongodb://${host}:${port}`;
// create a class DBClien that connects to mongoDB
class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    // initialize the client with the connection to the database
    this.init();
  }

  async init() {
    try {
      await this.client.connect();
      this.db = this.client.db(dbName);
      console.log(`Connected to the database: ${this.db.databaseName}`);
    } catch (err) {
      console.error(err);
    }
  }

  // a function isAlive that returns true when the connection to MongoDB is a success otherwise, false
  isAlive() {
    if (this.client.isConnected()) {
      return true;
    }
    return false;
  }

  // asynchronous function nbUsers that returns the number of documents in the collection users
  async nbUsers() {
    try {
      const collection = this.db.collection('users');
      const result = await collection.countDocuments();
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // an asynchronous function nbFiles that returns the number of documents in the collection files
  async nbFiles() {
    try {
      const collection = this.db.collection('files');
      const result = await collection.countDocuments();
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

// create an instane of the class and export it
const dbClient = new DBClient();
export default dbClient;
