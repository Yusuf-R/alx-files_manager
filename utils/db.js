/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
const { MongoClient, ObjectId } = require('mongodb');
// sha1 hash the password
const sha1 = require('sha1');

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
      // console.log(`Connected to the database: ${this.db.databaseName}`);
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

  // an asynchronous function addUser that inserts a document in the collection users
  async addUser(email, password) {
    try {
      const collection = this.db.collection('users');
      const hashedPassword = sha1(password);
      const obj = {
        email,
        password: hashedPassword,
      };
      const result = await collection.insertOne(obj);
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // an asynchronous funtion to check if email of a user exists in the collection users
  async checkUser(email) {
    const collection = this.db.collection('users');
    const result = await collection.findOne({ email });
    return result;
  }

  // an asynchronous function to check if email and password of a user exists in the collection users
  async checkUserPassword(email, password) {
    const collection = this.db.collection('users');
    const hashedPassword = sha1(password);
    const result = await collection.findOne({ email, password: hashedPassword });
    return result;
  }

  // an asynchronous function to check user and password base on the token
  async checkUserToken(token) {
    // decode the token to get the email and password
    try {
      const decodedToken = (Buffer.from(token, 'base64').toString().split(':'));
      if (decodedToken.length !== 2) {
        return null;
      }
      const email = decodedToken[0];
      const password = decodedToken[1];
      const result = await this.checkUserPassword(email, password);
      return result;
    } catch (error) {
      return null;
    }
  }

  // an asynchronous function to get the user object from the user_id
  async getUser(userId) {
    const objId = new ObjectId(userId);
    const collection = this.db.collection('users');
    // find the user that matches the id
    const result = await collection.findOne({ _id: objId });
    return result;
  }

  // an asynchronous function to check if a file exists in the collection files
  async checkFile(filename) {
    const collection = this.db.collection('files');
    const result = await collection.findOne({ filename });
    return result;
  }

  // an asynchronous functoin to get the Parent folder for a given pareintId
  async getParent(parentId, userObj) {
    const collection = this.db.collection('files');
    const objID = new ObjectId(parentId);
    const usrID = new ObjectId(userObj._id);
    const result = await collection.findOne({ _id: objID, userId: usrID });
    console.log(result);
    return result;
  }

  // an asnchronous funtion to creeate new file document
  async createNewDoc(obj) {
    const collection = this.db.collection('files');
    try {
      const restult = await collection.insertOne(obj);
      return restult;
    } catch (err) {
      return null;
    }
  }
}

// create an instane of the class and export it
const dbClient = new DBClient();
export default dbClient;
