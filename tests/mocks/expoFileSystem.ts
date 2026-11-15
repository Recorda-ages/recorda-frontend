export const mockDeleteFile = jest.fn();

export class File extends Blob {
  uri: string;

  static downloadFileAsync = jest.fn(async (url: string) => new File(url));

  constructor(uri: string) {
    super([]);
    this.uri = uri;
  }

  get name() {
    return this.uri.split("/").pop() ?? "";
  }

  delete() {
    mockDeleteFile(this.uri);
  }
}

export const Paths = {
  cache: { uri: "file:///cache/" }
};
