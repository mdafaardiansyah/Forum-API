/* eslint-disable camelcase */
exports.up = (pgm) => {
  // Add like_count column to comments table
  pgm.addColumn('comments', {
    like_count: {
      type: 'INTEGER',
      notNull: true,
      default: 0,
    },
  });

  // Create comment_likes table
  pgm.createTable('comment_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    comment_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    created_at: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Add foreign key constraints
  pgm.addConstraint('comment_likes', 'fk_comment_likes.comment_id_comments.id', 'FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE');
  pgm.addConstraint('comment_likes', 'fk_comment_likes.user_id_users.id', 'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE');
  
  // Add unique constraint to prevent duplicate likes
  pgm.addConstraint('comment_likes', 'uk_comment_likes_comment_user', 'UNIQUE(comment_id, user_id)');

  // Create indexes for better performance
  pgm.createIndex('comment_likes', 'comment_id');
  pgm.createIndex('comment_likes', 'user_id');
  pgm.createIndex('comment_likes', 'created_at');
  pgm.createIndex('comments', 'like_count');

  // Create function to update like count
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_comment_like_count()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE comments 
            SET like_count = like_count + 1 
            WHERE id = NEW.comment_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE comments 
            SET like_count = like_count - 1 
            WHERE id = OLD.comment_id;
            RETURN OLD;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create trigger to automatically update like count
  pgm.sql(`
    CREATE TRIGGER trigger_update_comment_like_count
        AFTER INSERT OR DELETE ON comment_likes
        FOR EACH ROW
        EXECUTE FUNCTION update_comment_like_count();
  `);
};

exports.down = (pgm) => {
  // Drop trigger and function
  pgm.sql('DROP TRIGGER IF EXISTS trigger_update_comment_like_count ON comment_likes;');
  pgm.sql('DROP FUNCTION IF EXISTS update_comment_like_count();');
  
  // Drop indexes
  pgm.dropIndex('comments', 'like_count');
  pgm.dropIndex('comment_likes', 'created_at');
  pgm.dropIndex('comment_likes', 'user_id');
  pgm.dropIndex('comment_likes', 'comment_id');
  
  // Drop table
  pgm.dropTable('comment_likes');
  
  // Remove like_count column from comments
  pgm.dropColumn('comments', 'like_count');
};
