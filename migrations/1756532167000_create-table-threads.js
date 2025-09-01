/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('threads', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    title: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    body: {
      type: 'TEXT',
      notNull: true,
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
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
  pgm.createIndex('threads', 'owner');
  pgm.createIndex('threads', 'date', { order: 'DESC' });
  pgm.createIndex('threads', 'created_at', { order: 'DESC' });
};

exports.down = (pgm) => {
  pgm.dropTable('threads');
};