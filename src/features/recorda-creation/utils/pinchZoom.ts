export type PinchTouch = Readonly<{ pageX: number; pageY: number }>;

const ZOOM_SENSITIVITY = 0.5;

export class PinchZoomTracker {
  private startDistance: number | null = null;
  private startZoom = 0;
  private zoom = 0;

  constructor(private readonly maxZoom: number) {}

  current() {
    return this.zoom;
  }

  reset() {
    this.zoom = 0;
    this.startDistance = null;
  }

  end() {
    this.startDistance = null;
  }

  update(touches: readonly PinchTouch[]) {
    if (touches.length < 2) return this.zoom;
    const distance = Math.hypot(
      touches[0].pageX - touches[1].pageX,
      touches[0].pageY - touches[1].pageY
    );
    if (this.startDistance === null || this.startDistance === 0) {
      this.startDistance = distance;
      this.startZoom = this.zoom;
      return this.zoom;
    }
    const scale = distance / this.startDistance - 1;
    this.zoom = Math.min(this.maxZoom, Math.max(0, this.startZoom + scale * ZOOM_SENSITIVITY));
    return this.zoom;
  }
}
