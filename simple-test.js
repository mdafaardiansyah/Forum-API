const pool = require('./src/Infrastructures/database/postgres/pool');

async function testSequence() {
  try {
    console.log('Starting test sequence...');
    
    // Clean all tables first
    await pool.query('DELETE FROM comments WHERE 1=1');
    await pool.query('DELETE FROM threads WHERE 1=1');
    await pool.query('DELETE FROM users WHERE 1=1');
    console.log('Tables cleaned');
    
    // Add user
    await pool.query({
      text: 'INSERT INTO users VALUES($1, $2, $3, $4)',
      values: ['user-123', 'dicoding', 'secret', 'Dicoding Indonesia']
    });
    console.log('User added');
    
    // Verify user exists
    const userResult = await pool.query({
      text: 'SELECT * FROM users WHERE id = $1',
      values: ['user-123']
    });
    console.log('User exists:', userResult.rows.length > 0);
    
    // Add thread
    await pool.query({
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4, $5)',
      values: ['thread-123', 'A Thread', 'Thread body', 'user-123', new Date().toISOString()]
    });
    console.log('Thread added');
    
    // Verify thread exists
    const threadResult = await pool.query({
      text: 'SELECT * FROM threads WHERE id = $1',
      values: ['thread-123']
    });
    console.log('Thread exists:', threadResult.rows.length > 0);
    console.log('Thread data:', threadResult.rows[0]);
    
    // Add comment
    await pool.query({
      text: 'INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6)',
      values: ['comment-123', 'A comment', 'thread-123', 'user-123', false, new Date().toISOString()]
    });
    console.log('Comment added successfully!');
    
    // Verify comment exists
    const commentResult = await pool.query({
      text: 'SELECT * FROM comments WHERE id = $1',
      values: ['comment-123']
    });
    console.log('Comment exists:', commentResult.rows.length > 0);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testSequence();