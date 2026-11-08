export const SaveFormat = {
  JPEG: "jpeg",
  PNG: "png"
};

export const mockContextRelease = jest.fn<void, []>();
export const mockResize = jest.fn<void, [{ height?: number; width?: number }]>();
export const mockImageRelease = jest.fn<void, []>();
export const mockSaveAsync = jest.fn<
  Promise<{ uri: string }>,
  [{ compress: number; format: string }]
>();
export const mockRenderAsync = jest.fn<
  Promise<{ release: () => void; saveAsync: typeof mockSaveAsync }>,
  []
>();
export const mockManipulate = jest.fn<
  { release: () => void; renderAsync: typeof mockRenderAsync; resize: typeof mockResize },
  [string]
>();

export function resetImageManipulatorMock() {
  mockContextRelease.mockReset();
  mockResize.mockReset();
  mockImageRelease.mockReset();
  mockSaveAsync.mockReset();
  mockSaveAsync.mockResolvedValue({ uri: "file://compressed.jpg" });
  mockRenderAsync.mockReset();
  mockRenderAsync.mockResolvedValue({
    release: mockImageRelease,
    saveAsync: mockSaveAsync
  });
  mockManipulate.mockReset();
  mockManipulate.mockReturnValue({
    release: mockContextRelease,
    renderAsync: mockRenderAsync,
    resize: mockResize
  });
}

resetImageManipulatorMock();

export const ImageManipulator = {
  manipulate: mockManipulate
};
