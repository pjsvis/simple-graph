import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleGraph } from '../../src/SimpleGraph';

// Mock SimpleGraph to prevent actual database connections
const mockNodes = {
  get: vi.fn((id) => {
    if (id === 0) return { id: 0, type: 'genesis' };
    if (id === 1) return { id: 1, type: 'test' };
    return null;
  }),
  find: vi.fn((query) => {
    if (query === 'test') return [{ id: 1, type: 'test' }];
    return [];
  }),
};
const mockEdges = {
  forNode: vi.fn((id) => {
    if (id === 0) return [{ from: 0, to: 1, type: 'link' }];
    return [];
  }),
};
const mockGraph = {
  nodes: mockNodes,
  edges: mockEdges,
  close: vi.fn(() => Promise.resolve()),
};

vi.mock('../../src/SimpleGraph', () => ({
  SimpleGraph: {
    connect: vi.fn(() => Promise.resolve(mockGraph)), // Still return a promise as cli.js awaits it
  },
}));

describe.skip('cli.js', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  const originalArgv = process.argv;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock process.exit to throw an error, so we can catch it in the test
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit called with code: ${code}`);
    }) as any);

    // Reset mocks before each test
    vi.clearAllMocks();
    // Reset mock implementations for SimpleGraph methods
    mockNodes.get.mockClear();
    mockNodes.find.mockClear();
    mockEdges.forNode.mockClear();
    mockGraph.close.mockClear();
    (SimpleGraph.connect as vi.Mock).mockClear();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
    process.argv = originalArgv;
  });

  const runCli = async () => {
    vi.resetModules(); // Ensure a fresh import of cli.js
    try {
      await import('../../src/cli');
    } catch (e: any) {
      // Catch the error thrown by mocked process.exit
      if (!e.message.startsWith('process.exit called with code:')) {
        throw e; // Re-throw if it's not our expected exit error
      }
    }
  };

  it('should call getNode and print result', async () => {
    process.argv = ['node', 'cli.js', 'getNode', '0'];
    await runCli();

    expect(SimpleGraph.connect).toHaveBeenCalledTimes(1);
    expect(mockNodes.get).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ id: 0, type: 'genesis' }, null, 2));
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should call find and print result', async () => {
    process.argv = ['node', 'cli.js', 'find', 'test'];
    await runCli();

    expect(SimpleGraph.connect).toHaveBeenCalledTimes(1);
    expect(mockNodes.find).toHaveBeenCalledWith('test');
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify([{ id: 1, type: 'test' }], null, 2));
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should call forNode and print result', async () => {
    process.argv = ['node', 'cli.js', 'forNode', '0'];
    await runCli();

    expect(SimpleGraph.connect).toHaveBeenCalledTimes(1);
    expect(mockEdges.forNode).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify([{ from: 0, to: 1, type: 'link' }], null, 2));
    expect(errorSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should print error for unknown command', async () => {
    process.argv = ['node', 'cli.js', 'unknownCommand'];
    await runCli();

    expect(errorSpy).toHaveBeenCalledWith("Error: Unknown command 'unknownCommand'.");
    expect(logSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should print error if getNode is missing ID', async () => {
    process.argv = ['node', 'cli.js', 'getNode'];
    await runCli();

    expect(errorSpy).toHaveBeenCalledWith('Error: getNode requires an ID.');
    expect(logSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should print error if find is missing query', async () => {
    process.argv = ['node', 'cli.js', 'find'];
    await runCli();

    expect(errorSpy).toHaveBeenCalledWith('Error: find requires a query string.');
    expect(logSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should print error if forNode is missing ID', async () => {
    process.argv = ['node', 'cli.js', 'forNode'];
    await runCli();

    expect(errorSpy).toHaveBeenCalledWith('Error: forNode requires an ID.');
    expect(logSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle errors from SimpleGraph methods', async () => {
    // Mock a method to throw an error
    (SimpleGraph.connect as vi.Mock).mockImplementationOnce(() => {
      const errorMockNodes = {
        get: vi.fn(() => {
          throw new Error('Database error');
        }),
        find: vi.fn(),
      };
      const errorMockEdges = {
        forNode: vi.fn(),
      };
      const errorMockGraph = {
        nodes: errorMockNodes,
        edges: errorMockEdges,
        close: vi.fn(() => Promise.resolve()),
      };
      return Promise.resolve(errorMockGraph);
    });

    process.argv = ['node', 'cli.js', 'getNode', '0'];
    await runCli();

    expect(errorSpy).toHaveBeenCalledWith('Error: Database error');
    expect(logSpy).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});