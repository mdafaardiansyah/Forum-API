class GetThreadsUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute() {
    const threads = await this._threadRepository.getThreadsWithComments();

    return {
      threads: threads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        body: thread.body,
        date: thread.date instanceof Date ? thread.date.toISOString() : thread.date,
        username: thread.username,
      })),
    };
  }
}

module.exports = GetThreadsUseCase;
