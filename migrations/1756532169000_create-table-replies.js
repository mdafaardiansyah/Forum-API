/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('replies', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    comment_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'comments(id)',
      onDelete: 'CASCADE',
    },
    content: {
      type: 'TEXT',
      notNull: true,
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    is_delete: {
      type: 'BOOLEAN',
      default: false,
      notNull: true,
    },
    date: {
      type: 'TIMESTAMP WITH TIME ZONE',
      default: pgm.func('NOW()'),
    },
    created_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      default: pgm.func('NOW()'),
    },
  });

  // Add indexes for performance optimization
  pgm.createIndex('replies', 'comment_id');
  pgm.createIndex('replies', 'owner');
  pgm.createIndex('replies', 'date', { order: 'ASC' });
  pgm.createIndex('replies', 'is_delete');
  pgm.createIndex('replies', ['comment_id', 'is_delete']);
  pgm.createIndex('replies', 'created_at', { order: 'DESC' });
};

exports.down = (pgm) => {
  pgm.dropTable('replies');
};