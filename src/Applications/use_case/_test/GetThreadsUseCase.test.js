const GetThreadsUseCase = require('../GetThreadsUseCase');

describe('GetThreadsUseCase', () => {
  it('should orchestrate the get threads action correctly', async () => {
    // Arrange
    const mockThreadRepository = {
      getThreadsWithComments: jest.fn(),
    };
    const mockThreads = [
      {
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: new Date('2023-01-01'),
        username: 'user123',
      },
    ];

    mockThreadRepository.getThreadsWithComments
      .mockImplementation(() => Promise.resolve(mockThreads));

    const getThreadsUseCase = new GetThreadsUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const result = await getThreadsUseCase.execute();

    // Assert
    expect(result).toStrictEqual({
      threads: [
        {
          id: 'thread-123',
          title: 'Thread Title',
          body: 'Thread Body',
          date: '2023-01-01T00:00:00.000Z',
          username: 'user123',
        },
      ],
    });
    expect(mockThreadRepository.getThreadsWithComments).toBeCalledTimes(1);
  });

  it('should handle date as string correctly', async () => {
    // Arrange
    const mockThreadRepository = {
      getThreadsWithComments: jest.fn(),
    };
    const mockThreads = [
      {
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: '2023-01-01T00:00:00.000Z', // date as string
        username: 'user123',
      },
    ];

    mockThreadRepository.getThreadsWithComments
      .mockImplementation(() => Promise.resolve(mockThreads));

    const getThreadsUseCase = new GetThreadsUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const result = await getThreadsUseCase.execute();

    // Assert
    expect(result).toStrictEqual({
      threads: [
        {
          id: 'thread-123',
          title: 'Thread Title',
          body: 'Thread Body',
          date: '2023-01-01T00:00:00.000Z',
          username: 'user123',
        },
      ],
    });
    expect(mockThreadRepository.getThreadsWithComments).toBeCalledTimes(1);
  });

  it('should handle empty threads array', async () => {
    // Arrange
    const mockThreadRepository = {
      getThreadsWithComments: jest.fn(),
    };
    const mockThreads = [];

    mockThreadRepository.getThreadsWithComments
      .mockImplementation(() => Promise.resolve(mockThreads));

    const getThreadsUseCase = new GetThreadsUseCase({
      threadRepository: mockThreadRepository,
    });

    // Action
    const result = await getThreadsUseCase.execute();

    // Assert
    expect(result).toStrictEqual({
      threads: [],
    });
    expect(mockThreadRepository.getThreadsWithComments).toBeCalledTimes(1);
  });
});
