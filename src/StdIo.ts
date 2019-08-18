export default class StdIo {
  private _out: typeof process.stdout.write;
  private _err: typeof process.stderr.write;
  private _bufferedOutput: Set<() => void>;

  constructor() {
    this._out = process.stdout.write.bind(process.stdout);
    this._err = process.stderr.write.bind(process.stderr);
    this._bufferedOutput = new Set<() => void>();

    this._wrapStdio(process.stdout);
    this._wrapStdio(process.stderr);
  }

  log(message: string) {
    process.stderr.write(message + '\n');
  }

  close() {
    this._forceFlushBufferedOutput();
    process.stdout.write = this._out;
    process.stderr.write = this._err;
  }

  // Don't wait for the debounced call and flush all output immediately.
  _forceFlushBufferedOutput() {
    for (const flushBufferedOutput of this._bufferedOutput) {
      flushBufferedOutput();
    }
  }

  _wrapStdio(stream: NodeJS.WriteStream) {
    const originalWrite = stream.write;

    let buffer: string[] = [];
    let timeout: NodeJS.Timeout | null = null;

    const flushBufferedOutput = () => {
      const string = buffer.join('');
      buffer = [];

      if (string) {
        originalWrite.call(stream, string);
      }

      this._bufferedOutput.delete(flushBufferedOutput);
    };

    this._bufferedOutput.add(flushBufferedOutput);

    const debouncedFlush = () => {
      // If the process blows up no errors would be printed.
      // There should be a smart way to buffer stderr, but for now
      // we just won't buffer it.
      if (stream === process.stderr) {
        flushBufferedOutput();
      } else {
        if (!timeout) {
          timeout = setTimeout(() => {
            flushBufferedOutput();
            timeout = null;
          }, 100);
        }
      }
    };

    stream.write = (chunk: string) => {
      buffer.push(chunk);
      debouncedFlush();
      return true;
    };
  }
}
