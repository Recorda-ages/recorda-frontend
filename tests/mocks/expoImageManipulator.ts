export const SaveFormat = {
  JPEG: "jpeg",
  PNG: "png"
};

export const ImageManipulator = {
  manipulate: () => ({
    release: () => undefined,
    renderAsync: () =>
      Promise.resolve({
        release: () => undefined,
        saveAsync: () => Promise.resolve({ uri: "file://compressed.jpg" })
      })
  })
};
