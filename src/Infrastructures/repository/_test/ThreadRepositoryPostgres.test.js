const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const InvariantError = require('../../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist new thread and return added thread correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      const newThread = new NewThread({
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123'; // stub!
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert
      const threads = await ThreadsTableTestHelper.findThreadsById('thread-123');
      expect(threads).toHaveLength(1);
      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: 'sebuah thread',
        owner: 'user-123',
      }));
    });
  });

  describe('verifyThreadExists function', () => {
    it('should throw NotFoundError when thread not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyThreadExists('thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when thread available', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.verifyThreadExists('thread-123'))
        .resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('getThreadById function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.getThreadById('thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should return thread correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-123',
        date: '2021-08-08T07:19:09.775Z',
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const thread = await threadRepositoryPostgres.getThreadById('thread-123');

      // Assert
      expect(thread).toStrictEqual({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
      });
    });
  });

  describe('getThreadsWithComments function', () => {
    it('should return empty array when no threads found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const threads = await threadRepositoryPostgres.getThreadsWithComments();

      // Assert
      expect(threads).toEqual([]);
    });

    it('should return threads correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-123',
        date: '2021-08-08T07:19:09.775Z',
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const threads = await threadRepositoryPostgres.getThreadsWithComments();

      // Assert
      expect(threads).toHaveLength(1);
      expect(threads[0].id).toEqual('thread-123');
      expect(threads[0].title).toEqual('sebuah thread');
      expect(threads[0].username).toEqual('dicoding');
    });
  });

  describe('getDetailThreadById function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(threadRepositoryPostgres.getDetailThreadById('thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should return thread detail correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-123',
        date: '2021-08-08T07:19:09.775Z',
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const thread = await threadRepositoryPostgres.getDetailThreadById('thread-123');

      // Assert
      expect(thread).toStrictEqual({
        id: 'thread-123',
        title: 'sebuah thread',
        body: 'sebuah body thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
      });
    });
  });
});