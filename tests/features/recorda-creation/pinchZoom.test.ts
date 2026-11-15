import { PinchZoomTracker } from "@/features/recorda-creation/utils/pinchZoom";

function fingers(gap: number) {
  return [
    { pageX: 100, pageY: 100 },
    { pageX: 100 + gap, pageY: 100 }
  ];
}

describe("PinchZoomTracker", () => {
  it("starts unzoomed and ignores a single finger", () => {
    const tracker = new PinchZoomTracker(0.5);

    expect(tracker.current()).toBe(0);
    expect(tracker.update([{ pageX: 1, pageY: 1 }])).toBe(0);
  });

  it("zooms in when the fingers spread and out when they come together", () => {
    const tracker = new PinchZoomTracker(0.5);
    tracker.update(fingers(100));

    const zoomedIn = tracker.update(fingers(150));
    expect(zoomedIn).toBeGreaterThan(0);

    expect(tracker.update(fingers(120))).toBeLessThan(zoomedIn);
  });

  it("clamps between zero and the maximum", () => {
    const tracker = new PinchZoomTracker(0.5);
    tracker.update(fingers(100));

    expect(tracker.update(fingers(1000))).toBe(0.5);
    expect(tracker.update(fingers(1))).toBe(0);
  });

  it("keeps the zoom between gestures and resets on demand", () => {
    const tracker = new PinchZoomTracker(0.5);
    tracker.update(fingers(100));
    const first = tracker.update(fingers(140));
    tracker.end();

    tracker.update(fingers(100));
    expect(tracker.update(fingers(100))).toBe(first);

    tracker.reset();
    expect(tracker.current()).toBe(0);
  });
});
