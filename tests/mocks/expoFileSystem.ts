export class File extends Blob {
  uri: string;

  constructor(uri: string) {
    super([]);
    this.uri = uri;
  }

  get name() {
    return this.uri.split("/").pop() ?? "";
  }
}
