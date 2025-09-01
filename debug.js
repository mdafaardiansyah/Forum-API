const pool = require('./src/Infrastructures/database/postgres/pool');
const UsersTableTestHelper = require('./tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('./tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('./tests/CommentsTableTestHelper');

async function debug() {
  try {
    console.log('Starting debug...');
    
    // Clean tables first
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    console.log('Tables cleaned');
    
    // Add user
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'dicoding' });
    console.log('User added successfully');
    
    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', ['user-123']);
    console.log('User exists:', userResult.rows.length > 0);
    
    // Add thread
    await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
    console.log('Thread added successfully');
    
    // Check if thread exists
    const threadResult = await pool.query('SELECT * FROM threads WHERE id = $1', ['thread-123']);
    console.log('Thread exists:', threadResult.rows.length > 0);
    console.log('Thread data:', threadResult.rows);
    
    // Try to add comment
    await CommentsTableTestHelper.addComment({ id: 'comment-123', thread_id: 'thread-123', owner: 'user-123' });
    console.log('Comment added successfully');
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
  }
}

debug();