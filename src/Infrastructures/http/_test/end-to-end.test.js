const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const LikesTableTestHelper = require('../../../../tests/LikesTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('End-to-End Forum API Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('Complete Forum Workflow', () => {
    it('should handle complete forum workflow: register -> login -> create thread -> add comment -> like comment -> get thread details', async () => {
      // Arrange
      const server = await createServer(container);

      // Step 1: Register two users
      const user1Registration = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'dicoding',
          password: 'secret',
          fullname: 'Dicoding Indonesia',
        },
      });

      const user2Registration = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'johndoe',
          password: 'secret',
          fullname: 'John Doe',
        },
      });

      // Assert: Users created successfully
      expect(user1Registration.statusCode).toEqual(201);
      expect(user2Registration.statusCode).toEqual(201);

      const user1Data = JSON.parse(user1Registration.payload);
      const user2Data = JSON.parse(user2Registration.payload);
      expect(user1Data.status).toEqual('success');
      expect(user2Data.status).toEqual('success');

      // Step 2: Login both users
      const user1Login = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'dicoding',
          password: 'secret',
        },
      });

      const user2Login = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'johndoe',
          password: 'secret',
        },
      });

      // Assert: Login successful
      expect(user1Login.statusCode).toEqual(201);
      expect(user2Login.statusCode).toEqual(201);

      const user1LoginData = JSON.parse(user1Login.payload);
      const user2LoginData = JSON.parse(user2Login.payload);
      const { accessToken: token1, refreshToken: refreshToken1 } = user1LoginData.data;
      const { accessToken: token2, refreshToken: refreshToken2 } = user2LoginData.data;

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(refreshToken1).toBeDefined();
      expect(refreshToken2).toBeDefined();

      // Step 3: User 1 creates a thread
      const threadCreation = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Sebuah Thread Diskusi',
          body: 'Ini adalah body thread untuk diskusi menarik',
        },
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      });

      // Assert: Thread created successfully
      expect(threadCreation.statusCode).toEqual(201);
      const threadData = JSON.parse(threadCreation.payload);
      expect(threadData.status).toEqual('success');
      expect(threadData.data.addedThread).toBeDefined();
      expect(threadData.data.addedThread.title).toEqual('Sebuah Thread Diskusi');

      const { id: threadId } = threadData.data.addedThread;

      // Step 4: Get all threads
      const threadsResponse = await server.inject({
        method: 'GET',
        url: '/threads',
      });

      // Assert: Threads retrieved successfully
      expect(threadsResponse.statusCode).toEqual(200);
      const threadsData = JSON.parse(threadsResponse.payload);
      expect(threadsData.status).toEqual('success');
      expect(threadsData.data.threads).toHaveLength(1);
      expect(threadsData.data.threads[0].id).toEqual(threadId);

      // Step 5: User 2 adds a comment to the thread
      const commentCreation = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'Ini adalah komentar yang sangat menarik!',
        },
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      });

      // Assert: Comment created successfully
      expect(commentCreation.statusCode).toEqual(201);
      const commentData = JSON.parse(commentCreation.payload);
      expect(commentData.status).toEqual('success');
      expect(commentData.data.addedComment).toBeDefined();
      expect(commentData.data.addedComment.content).toEqual('Ini adalah komentar yang sangat menarik!');

      const { id: commentId } = commentData.data.addedComment;

      // Step 6: User 1 adds another comment
      const comment2Creation = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'Saya setuju dengan komentar di atas!',
        },
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      });

      expect(comment2Creation.statusCode).toEqual(201);
      const comment2Data = JSON.parse(comment2Creation.payload);
      const { id: comment2Id } = comment2Data.data.addedComment;

      // Step 7: User 1 likes User 2's comment
      const likeResponse = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      });

      // Assert: Like added successfully
      expect(likeResponse.statusCode).toEqual(200);
      const likeData = JSON.parse(likeResponse.payload);
      expect(likeData.status).toEqual('success');

      // Step 8: User 2 also likes their own comment
      const selfLikeResponse = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      });

      expect(selfLikeResponse.statusCode).toEqual(200);

      // Step 9: User 1 likes the second comment too
      const like2Response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${comment2Id}/likes`,
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      });

      expect(like2Response.statusCode).toEqual(200);

      // Step 10: Get thread details with comments and like counts
      const threadDetailsResponse = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      // Assert: Thread details with correct like counts
      expect(threadDetailsResponse.statusCode).toEqual(200);
      const threadDetails = JSON.parse(threadDetailsResponse.payload);
      expect(threadDetails.status).toEqual('success');
      expect(threadDetails.data.thread).toBeDefined();
      expect(threadDetails.data.thread.id).toEqual(threadId);
      expect(threadDetails.data.thread.title).toEqual('Sebuah Thread Diskusi');
      expect(threadDetails.data.thread.body).toEqual('Ini adalah body thread untuk diskusi menarik');
      expect(threadDetails.data.thread.username).toEqual('dicoding');
      expect(threadDetails.data.thread.comments).toHaveLength(2);

      // Check first comment (should have 2 likes)
      const firstComment = threadDetails.data.thread.comments.find((c) => c.id === commentId);
      expect(firstComment).toBeDefined();
      expect(firstComment.content).toEqual('Ini adalah komentar yang sangat menarik!');
      expect(firstComment.username).toEqual('johndoe');
      expect(firstComment.likeCount).toEqual(2);

      // Check second comment (should have 1 like)
      const secondComment = threadDetails.data.thread.comments.find((c) => c.id === comment2Id);
      expect(secondComment).toBeDefined();
      expect(secondComment.content).toEqual('Saya setuju dengan komentar di atas!');
      expect(secondComment.username).toEqual('dicoding');
      expect(secondComment.likeCount).toEqual(1);

      // Step 11: User 1 unlikes the first comment (toggle)
      const unlikeResponse = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${token1}`,
        },
      });

      expect(unlikeResponse.statusCode).toEqual(200);

      // Step 12: Get thread details again to verify like count decreased
      const finalThreadDetailsResponse = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      expect(finalThreadDetailsResponse.statusCode).toEqual(200);
      const finalThreadDetails = JSON.parse(finalThreadDetailsResponse.payload);
      const finalFirstComment = finalThreadDetails.data.thread.comments.find((c) => c.id === commentId);
      expect(finalFirstComment.likeCount).toEqual(1); // Should be 1 now (only User 2's like)

      // Step 13: User 2 deletes their comment
      const deleteCommentResponse = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      });

      expect(deleteCommentResponse.statusCode).toEqual(200);

      // Step 14: Get thread details to verify comment is soft deleted
      const afterDeleteResponse = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      expect(afterDeleteResponse.statusCode).toEqual(200);
      const afterDeleteDetails = JSON.parse(afterDeleteResponse.payload);
      const deletedComment = afterDeleteDetails.data.thread.comments.find((c) => c.id === commentId);
      expect(deletedComment.content).toEqual('**komentar telah dihapus**');

      // Step 15: Refresh tokens
      const refreshResponse = await server.inject({
        method: 'PUT',
        url: '/authentications',
        payload: {
          refreshToken: refreshToken1,
        },
      });

      expect(refreshResponse.statusCode).toEqual(200);
      const refreshData = JSON.parse(refreshResponse.payload);
      expect(refreshData.data.accessToken).toBeDefined();

      // Step 16: Logout
      const logoutResponse = await server.inject({
        method: 'DELETE',
        url: '/authentications',
        payload: {
          refreshToken: refreshToken1,
        },
      });

      expect(logoutResponse.statusCode).toEqual(200);
      const logoutData = JSON.parse(logoutResponse.payload);
      expect(logoutData.status).toEqual('success');
    }, 30000); // Increase timeout for this comprehensive test

    it('should handle error scenarios gracefully in complete workflow', async () => {
      // Arrange
      const server = await createServer(container);

      // Test 1: Try to create thread without authentication
      const unauthorizedThreadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Unauthorized Thread',
          body: 'This should fail',
        },
      });

      expect(unauthorizedThreadResponse.statusCode).toEqual(401);

      // Test 2: Try to register user with existing username
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'testuser',
          password: 'secret',
          fullname: 'Test User',
        },
      });

      const duplicateUserResponse = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'testuser', // Same username
          password: 'secret',
          fullname: 'Another User',
        },
      });

      expect(duplicateUserResponse.statusCode).toEqual(400);

      // Test 3: Try to login with wrong credentials
      const wrongLoginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'testuser',
          password: 'wrongpassword',
        },
      });

      expect(wrongLoginResponse.statusCode).toEqual(401);

      // Test 4: Try to access non-existent thread
      const nonExistentThreadResponse = await server.inject({
        method: 'GET',
        url: '/threads/thread-404',
      });

      expect(nonExistentThreadResponse.statusCode).toEqual(404);

      // Test 5: Try to like comment on non-existent thread
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'testuser',
          password: 'secret',
        },
      });

      const { data: { accessToken } } = JSON.parse(loginResponse.payload);

      const likeNonExistentResponse = await server.inject({
        method: 'PUT',
        url: '/threads/thread-404/comments/comment-404/likes',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(likeNonExistentResponse.statusCode).toEqual(404);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle multiple concurrent users creating threads', async () => {
      // Arrange
      const server = await createServer(container);
      const userCount = 10;
      let users = [];

      // Create multiple users
      const userCreationPromises = [];
      for (let i = 0; i < userCount; i += 1) {
        userCreationPromises.push(
          server.inject({
            method: 'POST',
            url: '/users',
            payload: {
              username: `user${i}`,
              password: 'secret',
              fullname: `User ${i}`,
            },
          }),
        );
      }
      await Promise.all(userCreationPromises);

      // Login all users
      const loginPromises = [];
      for (let i = 0; i < userCount; i += 1) {
        loginPromises.push(
          server.inject({
            method: 'POST',
            url: '/authentications',
            payload: {
              username: `user${i}`,
              password: 'secret',
            },
          }),
        );
      }
      const loginResponses = await Promise.all(loginPromises);

      // Extract user tokens
      users = loginResponses.map((response, i) => {
        const { data: { accessToken } } = JSON.parse(response.payload);
        return { username: `user${i}`, token: accessToken };
      });

      // Action: All users create threads concurrently
      const threadCreationPromises = users.map((user, index) => server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: `Thread by ${user.username}`,
          body: `This is thread number ${index}`,
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }));

      const responses = await Promise.all(threadCreationPromises);

      // Assert: All threads should be created successfully
      responses.forEach((response, index) => {
        expect(response.statusCode).toEqual(201);
        const responseData = JSON.parse(response.payload);
        expect(responseData.status).toEqual('success');
        expect(responseData.data.addedThread.title).toEqual(`Thread by user${index}`);
      });

      // Verify all threads exist
      const allThreadsResponse = await server.inject({
        method: 'GET',
        url: '/threads',
      });

      expect(allThreadsResponse.statusCode).toEqual(200);
      const allThreadsData = JSON.parse(allThreadsResponse.payload);
      expect(allThreadsData.data.threads).toHaveLength(userCount);
    }, 20000);

    it('should handle multiple users liking the same comment concurrently', async () => {
      // Arrange
      const server = await createServer(container);
      const userCount = 5;
      let users = [];

      // Create thread owner
      await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'threadowner',
          password: 'secret',
          fullname: 'Thread Owner',
        },
      });

      const ownerLoginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'threadowner',
          password: 'secret',
        },
      });

      const { data: { accessToken: ownerToken } } = JSON.parse(ownerLoginResponse.payload);

      // Create thread and comment
      const threadResponse = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Popular Thread',
          body: 'This will get many likes',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });

      const { data: { addedThread } } = JSON.parse(threadResponse.payload);

      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: 'This comment will be liked by many users',
        },
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
      });

      const { data: { addedComment } } = JSON.parse(commentResponse.payload);

      // Create multiple users
      const likerCreationPromises = [];
      for (let i = 0; i < userCount; i += 1) {
        likerCreationPromises.push(
          server.inject({
            method: 'POST',
            url: '/users',
            payload: {
              username: `liker${i}`,
              password: 'secret',
              fullname: `Liker ${i}`,
            },
          }),
        );
      }
      await Promise.all(likerCreationPromises);

      // Login all liker users
      const likerLoginPromises = [];
      for (let i = 0; i < userCount; i += 1) {
        likerLoginPromises.push(
          server.inject({
            method: 'POST',
            url: '/authentications',
            payload: {
              username: `liker${i}`,
              password: 'secret',
            },
          }),
        );
      }
      const likerLoginResponses = await Promise.all(likerLoginPromises);

      // Extract liker access tokens and create users array
      users = likerLoginResponses.map((response, i) => {
        const { data: { accessToken } } = JSON.parse(response.payload);
        return { username: `liker${i}`, token: accessToken };
      });

      // Action: All users like the same comment concurrently
      const likePromises = users.map((user) => server.inject({
        method: 'PUT',
        url: `/threads/${addedThread.id}/comments/${addedComment.id}/likes`,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }));

      const likeResponses = await Promise.all(likePromises);

      // Assert: All likes should be successful
      likeResponses.forEach((response) => {
        expect(response.statusCode).toEqual(200);
        const responseData = JSON.parse(response.payload);
        expect(responseData.status).toEqual('success');
      });

      // Verify final like count
      const finalThreadResponse = await server.inject({
        method: 'GET',
        url: `/threads/${addedThread.id}`,
      });

      expect(finalThreadResponse.statusCode).toEqual(200);
      const finalThreadData = JSON.parse(finalThreadResponse.payload);
      const comment = finalThreadData.data.thread.comments[0];
      expect(comment.likeCount).toEqual(userCount);
    }, 15000);
  });
});
