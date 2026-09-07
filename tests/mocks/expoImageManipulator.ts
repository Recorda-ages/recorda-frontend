export const SaveFormat = {
  JPEG: "jpeg",
  PNG: "png"
};

export const mockContextRelease = jest.fn<void, []>();
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
  { release: () => void; renderAsync: typeof mockRenderAsync },
  [string]
>();

export function resetImageManipulatorMock() {
  mockContextRelease.mockReset();
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
    renderAsync: mockRenderAsync
  });
}

resetImageManipulatorMock();

export const ImageManipulator = {
  manipulate: mockManipulate
};
