/* eslint-disable max-len */
/* eslint-disable no-else-return */
// create a class called RedisClient

// any error of the redis client must be displayed in the console (you should use on('error') of the redis client)

// After the class definition, create and export an instance of RedisClient called redisClient
import { createClient } from 'redis';

const util = require('util');

class RedisClient {
  // the constructor that creates a client to Redis:
  constructor() {
    this.client = createClient();
    // upon succesful connection
    // this.client.on('connect', () => {
    //   console.log('Redis client connected to the server');
    // });
    // upon any error of the redis client
    this.client.on('error', (err) => {
      console.error(`Redis client not connected to the server: ${err}`);
    });
    // Manually promisify the nedded functions in the client object
    this.client.getAsync = util.promisify(this.client.get).bind(this.client);
    this.client.setExAsync = util.promisify(this.client.setex).bind(this.client);
    this.client.delAsync = util.promisify(this.client.del).bind(this.client);
  }

  // a function isAlive that returns true when the connection to Redis is a success otherwise, false
  isAlive() {
    if (this.client.connected) {
      return true;
    } else {
      return false;
    }
  }

  // an asynchronous function get that takes a string key as argument and returns the Redis value stored for this key
  async get(key) {
    try {
      const value = await this.client.getAsync(key);
      return value;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  // an asynchronous function set that takes two arguments (key, value) and sets the value in Redis for the given key
  async set(key, value, duration) {
    try {
      const result = await this.client.setExAsync(key, duration, value);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  // an asynchronous function del that takes a string key as argument and deletes the Redis value stored for this key
  async del(key) {
    try {
      const result = await this.client.delAsync(key);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
