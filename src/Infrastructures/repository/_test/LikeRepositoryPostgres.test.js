const LikesTableTestHelper = require('../../../../tests/LikesTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const InvariantError = require('../../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const NewLike = require('../../../Domains/likes/entities/NewLike');
const Like = require('../../../Domains/likes/entities/Like');
const LikeRepositoryPostgres = require('../LikeRepositoryPostgres');
const pool = require('../../database/postgres/pool');

describe('LikeRepositoryPostgres', () => {
  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addLike function', () => {
    it('should persist new like and return like correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });

      const newLike = new NewLike({
        commentId: 'comment-123',
        userId: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedLike = await likeRepositoryPostgres.addLike(newLike);

      // Assert
      const likes = await LikesTableTestHelper.findLikesById('like-123');
      expect(likes).toHaveLength(1);
      expect(addedLike).toStrictEqual(new Like({
        id: 'like-123',
        commentId: 'comment-123',
        userId: 'user-123',
        createdAt: addedLike.createdAt,
      }));
    });

    it('should throw InvariantError when like already exists', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await LikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', userId: 'user-123' });

      const newLike = new NewLike({
        commentId: 'comment-123',
        userId: 'user-123',
      });
      const fakeIdGenerator = () => '456';
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(likeRepositoryPostgres.addLike(newLike))
        .rejects.toThrowError(InvariantError);
    });

    it('should throw error when database error occurs (not unique constraint)', async () => {
      // Arrange
      const newLike = new NewLike({
        commentId: 'comment-123',
        userId: 'user-123',
      });
      const fakeIdGenerator = () => '123';

      // Mock pool to throw a different database error
      const mockPool = {
        query: jest.fn().mockRejectedValue(new Error('Database connection error')),
      };

      const likeRepositoryPostgres = new LikeRepositoryPostgres(mockPool, fakeIdGenerator);

      // Action & Assert
      await expect(likeRepositoryPostgres.addLike(newLike))
        .rejects.toThrowError('Database connection error');
    });
  });

  describe('deleteLike function', () => {
    it('should delete like correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await LikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', userId: 'user-123' });

      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      await likeRepositoryPostgres.deleteLike('comment-123', 'user-123');

      // Assert
      const likes = await LikesTableTestHelper.findLikesById('like-123');
      expect(likes).toHaveLength(0);
    });

    it('should throw NotFoundError when like not found', async () => {
      // Arrange
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(likeRepositoryPostgres.deleteLike('comment-123', 'user-123'))
        .rejects.toThrowError(NotFoundError);
    });
  });

  describe('verifyLikeExists function', () => {
    it('should not throw NotFoundError when like exists', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await LikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', userId: 'user-123' });

      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(likeRepositoryPostgres.verifyLikeExists('comment-123', 'user-123'))
        .resolves.not.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when like not exists', async () => {
      // Arrange
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(likeRepositoryPostgres.verifyLikeExists('comment-123', 'user-123'))
        .rejects.toThrowError(NotFoundError);
    });
  });

  describe('getLikesByCommentId function', () => {
    it('should return likes correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123' });
      await LikesTableTestHelper.addLike({ id: 'like-123', commentId: 'comment-123', userId: 'user-123' });

      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      const likes = await likeRepositoryPostgres.getLikesByCommentId('comment-123');

      // Assert
      expect(likes).toHaveLength(1);
      expect(likes[0]).toStrictEqual({
        id: 'like-123',
        commentId: 'comment-123',
        userId: 'user-123',
        username: 'dicoding',
        createdAt: expect.any(String),
      });
    });
  });

  describe('getLikeCount function', () => {
    it('should return like count correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', likeCount: 5 });

      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action
      const likeCount = await likeRepositoryPostgres.getLikeCount('comment-123');

      // Assert
      expect(likeCount).toEqual(5);
    });

    it('should throw NotFoundError when comment not found', async () => {
      // Arrange
      const likeRepositoryPostgres = new LikeRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(likeRepositoryPostgres.getLikeCount('comment-123'))
        .rejects.toThrowError(NotFoundError);
    });
  });
});
