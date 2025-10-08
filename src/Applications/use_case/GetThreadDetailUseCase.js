const DetailThread = require('../../Domains/threads/entities/DetailThread');
const Comment = require('../../Domains/comments/entities/Comment');
const Reply = require('../../Domains/replies/entities/Reply');

class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    const { threadId } = useCasePayload;

    // Verify thread exists
    await this._threadRepository.verifyThreadExists(threadId);

    // Get thread detail
    const thread = await this._threadRepository.getDetailThreadById(threadId);

    // Get comments for the thread
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);

    // Get replies and like count for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this._replyRepository.getRepliesByCommentId(comment.id);
        const likeCount = await this._commentRepository.getLikeCountByCommentId(comment.id);
        const mappedReplies = replies.map((reply) => new Reply({
          id: reply.id,
          content: reply.content,
          date: reply.date,
          username: reply.username,
          isDelete: reply.is_delete,
        }));

        return new Comment({
          id: comment.id,
          content: comment.content,
          date: comment.date,
          username: comment.username,
          isDelete: comment.is_delete,
          replies: mappedReplies,
          likeCount,
        });
      }),
    );

    return new DetailThread({
      id: thread.id,
      title: thread.title,
      body: thread.body,
      date: thread.date,
      username: thread.username,
      comments: commentsWithReplies,
    });
  }
}

module.exports = GetThreadDetailUseCase;
