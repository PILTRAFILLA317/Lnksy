import { browser } from '$app/environment';
import type {
  PreviewOrientation,
  PreviewZoomMode,
} from '$lib/types.js';

const PORTRAIT_ASPECT = 19.5 / 9;
const MIN_SCREEN_WIDTH = 320;
const FIT_SCREEN_WIDTH = 390;
const MAX_SCREEN_WIDTH = 430;

export type PreviewSizeClass = 'xs' | 'sm' | 'md' | 'lg';

export interface AutoFitResult {
  width: number;
  height: number;
  sizeClass: PreviewSizeClass;
}

export interface AutoFitParams {
  containerWidth: number;
  containerHeight: number;
  orientation: PreviewOrientation;
  zoomMode: PreviewZoomMode;
}

function getRatio(orientation: PreviewOrientation): number {
  return orientation === 'portrait' ? PORTRAIT_ASPECT : 1 / PORTRAIT_ASPECT;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getSizeClass(width: number): PreviewSizeClass {
  if (width <= 360) return 'xs';
  if (width <= 400) return 'sm';
  if (width <= 460) return 'md';
  return 'lg';
}

function zoomMultiplier(mode: PreviewZoomMode): number {
  if (mode === '90') return 0.9;
  if (mode === '110') return 1.1;
  return 1;
}

export function getAutoFitSize(params: AutoFitParams): AutoFitResult {
  const ratio = getRatio(params.orientation);
  const safeWidth = Math.max(0, params.containerWidth);
  const safeHeight = Math.max(0, params.containerHeight);

  const fitWidthByHeight = safeHeight / ratio;
  const fitWidth = Math.min(safeWidth, fitWidthByHeight, FIT_SCREEN_WIDTH);
  const zoomBaseWidth = Math.min(safeWidth, fitWidthByHeight, MAX_SCREEN_WIDTH);

  const rawWidth =
    params.zoomMode === 'FIT'
      ? fitWidth
      : zoomBaseWidth * zoomMultiplier(params.zoomMode);
  const maxAllowedWidth = Math.min(safeWidth, fitWidthByHeight, MAX_SCREEN_WIDTH);
  const width = Math.round(clamp(rawWidth, MIN_SCREEN_WIDTH, maxAllowedWidth));
  const height = Math.round(width * ratio);

  return {
    width,
    height,
    sizeClass: getSizeClass(width),
  };
}

export function createAutoFit(
  callback: (size: AutoFitResult) => void,
): {
  observe: (
    element: HTMLElement,
    getParams: () => Omit<AutoFitParams, 'containerWidth' | 'containerHeight'>,
  ) => () => void;
  recalculate: (
    element: HTMLElement,
    params: Omit<AutoFitParams, 'containerWidth' | 'containerHeight'>,
  ) => void;
} {
  let frame = 0;
  let observer: ResizeObserver | null = null;

  function cancelFrame() {
    if (!browser || frame === 0) return;
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function schedule(
    element: HTMLElement,
    params: Omit<AutoFitParams, 'containerWidth' | 'containerHeight'>,
  ) {
    if (!browser) return;
    cancelFrame();
    frame = requestAnimationFrame(() => {
      frame = 0;
      const size = getAutoFitSize({
        containerWidth: element.clientWidth,
        containerHeight: element.clientHeight,
        ...params,
      });
      callback(size);
    });
  }

  function observe(
    element: HTMLElement,
    getParams: () => Omit<AutoFitParams, 'containerWidth' | 'containerHeight'>,
  ) {
    if (!browser) return () => {};

    schedule(element, getParams());
    observer = new ResizeObserver(() => {
      schedule(element, getParams());
    });
    observer.observe(element);

    return () => {
      observer?.disconnect();
      observer = null;
      cancelFrame();
    };
  }

  return {
    observe,
    recalculate: (
      element: HTMLElement,
      params: Omit<AutoFitParams, 'containerWidth' | 'containerHeight'>,
    ) => {
      schedule(element, params);
    },
  };
}
