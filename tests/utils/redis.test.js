/* eslint-disable no-unused-vars */
/* eslint-disable global-require */
/* eslint-disable jest/no-hooks */
/* eslint-disable jest/prefer-expect-assertions */
/* eslint-disable jest/expect-expect */
const assert = require('assert');
const { describe, it } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const redisClient = require('../../utils/redis').default;

describe('test suite: redisClient', () => {
  // test: Redis object isAlive
  it('test: Redis object isAlive', () => {
    assert.equal(redisClient.isAlive(), true);
  });
  // test: Redis object get a random key, which will throw a null
  it('test: Null for a random key', async () => {
    const key = 'randomKey';
    const value = await redisClient.get(key);
    assert.equal(value, null);
  });
  // test: set a key and get it back
  it('test: set a key and get it back', async () => {
    const key = 'randomKey';
    const value = 'randomValue';
    const duration = 60;
    const result = await redisClient.set(key, value, duration);
    assert.equal(result, 'OK');
    const value2 = await redisClient.get(key);
    assert.equal(value2, value);
  });
});
