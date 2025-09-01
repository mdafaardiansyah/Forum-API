/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('comments', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    thread_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'threads(id)',
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
  pgm.createIndex('comments', 'thread_id');
  pgm.createIndex('comments', 'owner');
  pgm.createIndex('comments', 'date', { order: 'ASC' });
  pgm.createIndex('comments', 'is_delete');
  pgm.createIndex('comments', ['thread_id', 'is_delete']);
  pgm.createIndex('comments', 'created_at', { order: 'DESC' });
};

exports.down = (pgm) => {
  pgm.dropTable('comments');
};