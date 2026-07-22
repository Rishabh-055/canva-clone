import { fabric } from "fabric";
import { useCallback, useState, useMemo, useRef } from "react";

import { 
  Editor, 
  FILL_COLOR,
  STROKE_WIDTH,
  STROKE_COLOR,
  CIRCLE_OPTIONS,
  DIAMOND_OPTIONS,
  TRIANGLE_OPTIONS,
  BuildEditorProps, 
  RECTANGLE_OPTIONS,
  EditorHookProps,
  STROKE_DASH_ARRAY,
  TEXT_OPTIONS,
  FONT_FAMILY,
  FONT_WEIGHT,
  FONT_SIZE,
  JSON_KEYS,
} from "@/features/editor/types";
import { useHistory } from "@/features/editor/hooks/use-history";
import { 
  createFilter, 
  downloadFile, 
  isTextType,
  transformText
} from "@/features/editor/utils";
import { useHotkeys } from "@/features/editor/hooks/use-hotkeys";
import { useClipboard } from "@/features/editor/hooks/use-clipboard";
import { useAutoResize } from "@/features/editor/hooks/use-auto-resize";
import { useCanvasEvents } from "@/features/editor/hooks/use-canvas-events";
import { useWindowEvents } from "@/features/editor/hooks/use-window-events";
import { useLoadState } from "@/features/editor/hooks/use-load-state";

const buildEditor = ({
  save,
  undo,
  redo,
  canRedo,
  canUndo,
  autoZoom,
  copy,
  paste,
  canvas,
  fillColor,
  fontFamily,
  setFontFamily,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  selectedObjects,
  strokeDashArray,
  setStrokeDashArray,
}: BuildEditorProps): Editor => {
  const getWorkspace = () => {
    return canvas.getObjects().find((object) => object.name === "clip");
  };

  const generateSaveOptions = () => {
    const workspace = getWorkspace() as fabric.Rect;
    const { width = 0, height = 0, left = 0, top = 0 } = workspace || {};

    return {
      name: "Image",
      format: "png",
      quality: 1,
      width,
      height,
      left,
      top,
    };
  };

  const exportCanvasAsImage = (format: "png" | "jpg" | "svg") => {
    const options = generateSaveOptions();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);
    downloadFile(dataUrl, format);
    autoZoom();
  };

  const centerObjectOnWorkspace = (object: fabric.Object) => {
    const workspace = getWorkspace();
    const centerPoint = workspace?.getCenterPoint();
    if (!centerPoint) return;

    // @ts-ignore
    canvas._centerObject(object, centerPoint);
  };

  const addToCanvas = (object: fabric.Object) => {
    centerObjectOnWorkspace(object);
    canvas.add(object);
    canvas.setActiveObject(object);
  };

  return {
    savePng: () => exportCanvasAsImage("png"),
    saveJpg: () => exportCanvasAsImage("jpg"),
    saveSvg: () => exportCanvasAsImage("svg"),
    saveJson: async () => {
      const currentState = canvas.toJSON(JSON_KEYS);
      await transformText(currentState.objects);
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(currentState, null, "\t")
      )}`;
      downloadFile(jsonString, "json");
    },
    loadJson: (json: string) => {
      const data = JSON.parse(json);
      canvas.loadFromJSON(data, () => {
        autoZoom();
      });
    },
    canUndo,
    canRedo,
    autoZoom,
    getWorkspace,
    zoomIn: () => {
      let currentZoom = canvas.getZoom();
      currentZoom += 0.05;
      const centerPoint = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(centerPoint.left, centerPoint.top),
        Math.min(currentZoom, 1)
      );
    },
    zoomOut: () => {
      let currentZoom = canvas.getZoom();
      currentZoom -= 0.05;
      const centerPoint = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(centerPoint.left, centerPoint.top),
        Math.max(currentZoom, 0.2)
      );
    },
    changeSize: (dimensions: { width: number; height: number }) => {
      const workspace = getWorkspace();
      workspace?.set(dimensions);
      autoZoom();
      save();
    },
    changeBackground: (color: string) => {
      const workspace = getWorkspace();
      workspace?.set({ fill: color });
      canvas.renderAll();
      save();
    },
    enableDrawingMode: () => {
      canvas.discardActiveObject();
      canvas.renderAll();
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    },
    disableDrawingMode: () => {
      canvas.isDrawingMode = false;
    },
    onUndo: () => undo(),
    onRedo: () => redo(),
    onCopy: () => copy(),
    onPaste: () => paste(),
    changeImageFilter: (filterName: string) => {
      const activeObjects = canvas.getActiveObjects();
      activeObjects.forEach((object) => {
        if (object.type === "image") {
          const imageObj = object as fabric.Image;
          const effect = createFilter(filterName);

          imageObj.filters = effect ? [effect] : [];
          imageObj.applyFilters();
          canvas.renderAll();
        }
      });
    },
    addImage: (imageUrl: string) => {
      fabric.Image.fromURL(
        imageUrl,
        (image) => {
          const workspace = getWorkspace();
          image.scaleToWidth(workspace?.width || 0);
          image.scaleToHeight(workspace?.height || 0);
          addToCanvas(image);
        },
        { crossOrigin: "anonymous" }
      );
    },
    delete: () => {
      canvas.getActiveObjects().forEach((object) => canvas.remove(object));
      canvas.discardActiveObject();
      canvas.renderAll();
    },
    addText: (content, options) => {
      const textbox = new fabric.Textbox(content, {
        ...TEXT_OPTIONS,
        fill: fillColor,
        ...options,
      });
      addToCanvas(textbox);
    },
    getActiveOpacity: () => {
      const firstSelected = selectedObjects[0];
      return firstSelected?.get("opacity") ?? 1;
    },
    changeFontSize: (size: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ fontSize: size });
        }
      });
      canvas.renderAll();
    },
    getActiveFontSize: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return FONT_SIZE;
      // @ts-ignore
      return firstSelected.get("fontSize") || FONT_SIZE;
    },
    changeTextAlign: (alignment: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ textAlign: alignment });
        }
      });
      canvas.renderAll();
    },
    getActiveTextAlign: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return "left";
      // @ts-ignore
      return firstSelected.get("textAlign") || "left";
    },
    changeFontUnderline: (enabled: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ underline: enabled });
        }
      });
      canvas.renderAll();
    },
    getActiveFontUnderline: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return false;
      // @ts-ignore
      return firstSelected.get("underline") || false;
    },
    changeFontLinethrough: (enabled: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ linethrough: enabled });
        }
      });
      canvas.renderAll();
    },
    getActiveFontLinethrough: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return false;
      // @ts-ignore
      return firstSelected.get("linethrough") || false;
    },
    changeFontStyle: (style: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ fontStyle: style });
        }
      });
      canvas.renderAll();
    },
    getActiveFontStyle: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return "normal";
      // @ts-ignore
      return firstSelected.get("fontStyle") || "normal";
    },
    changeFontWeight: (weight: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ fontWeight: weight });
        }
      });
      canvas.renderAll();
    },
    changeOpacity: (opacity: number) => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ opacity });
      });
      canvas.renderAll();
    },
    bringForward: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.bringForward(object);
      });
      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    sendBackwards: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.sendBackwards(object);
      });
      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    changeFontFamily: (family: string) => {
      setFontFamily(family);
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          object.set({ fontFamily: family });
        }
      });
      canvas.renderAll();
    },
    changeFillColor: (color: string) => {
      setFillColor(color);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ fill: color });
      });
      canvas.renderAll();
    },
    changeStrokeColor: (color: string) => {
      setStrokeColor(color);
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          object.set({ fill: color });
          return;
        }
        object.set({ stroke: color });
      });
      canvas.freeDrawingBrush.color = color;
      canvas.renderAll();
    },
    changeStrokeWidth: (width: number) => {
      setStrokeWidth(width);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeWidth: width });
      });
      canvas.freeDrawingBrush.width = width;
      canvas.renderAll();
    },
    changeStrokeDashArray: (dashArray: number[]) => {
      setStrokeDashArray(dashArray);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeDashArray: dashArray });
      });
      canvas.renderAll();
    },
    addCircle: () => {
      const circle = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray,
      });
      addToCanvas(circle);
    },
    addSoftRectangle: () => {
      const rect = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: 50,
        ry: 50,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray,
      });
      addToCanvas(rect);
    },
    addRectangle: () => {
      const rect = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray,
      });
      addToCanvas(rect);
    },
    addTriangle: () => {
      const triangle = new fabric.Triangle({
        ...TRIANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        strokeDashArray,
      });
      addToCanvas(triangle);
    },
    addInverseTriangle: () => {
      const h = TRIANGLE_OPTIONS.height;
      const w = TRIANGLE_OPTIONS.width;

      const polygon = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w / 2, y: h },
        ],
        {
          ...TRIANGLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          strokeDashArray,
        }
      );
      addToCanvas(polygon);
    },
    addDiamond: () => {
      const h = DIAMOND_OPTIONS.height;
      const w = DIAMOND_OPTIONS.width;

      const polygon = new fabric.Polygon(
        [
          { x: w / 2, y: 0 },
          { x: w, y: h / 2 },
          { x: w / 2, y: h },
          { x: 0, y: h / 2 },
        ],
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          strokeDashArray,
        }
      );
      addToCanvas(polygon);
    },
    canvas,
    getActiveFontWeight: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return FONT_WEIGHT;
      // @ts-ignore
      return firstSelected.get("fontWeight") || FONT_WEIGHT;
    },
    getActiveFontFamily: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return fontFamily;
      // @ts-ignore
      return firstSelected.get("fontFamily") || fontFamily;
    },
    getActiveFillColor: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return fillColor;
      return (firstSelected.get("fill") || fillColor) as string;
    },
    getActiveStrokeColor: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return strokeColor;
      return (firstSelected.get("stroke") || strokeColor) as string;
    },
    getActiveStrokeWidth: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return strokeWidth;
      return (firstSelected.get("strokeWidth") || strokeWidth) as number;
    },
    getActiveStrokeDashArray: () => {
      const firstSelected = selectedObjects[0];
      if (!firstSelected) return strokeDashArray;
      return (firstSelected.get("strokeDashArray") || strokeDashArray) as number[];
    },
    selectedObjects,
  };
};

export const useEditor = ({
  defaultState,
  defaultHeight,
  defaultWidth,
  clearSelectionCallback,
  saveCallback,
}: EditorHookProps) => {
  const initialState = useRef(defaultState);
  const initialWidth = useRef(defaultWidth);
  const initialHeight = useRef(defaultHeight);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

  const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
  const [fillColor, setFillColor] = useState(FILL_COLOR);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
  const [strokeDashArray, setStrokeDashArray] = useState<number[]>(STROKE_DASH_ARRAY);

  useWindowEvents();

  const { 
    save, 
    canRedo, 
    canUndo, 
    undo, 
    redo,
    canvasHistory,
    setHistoryIndex,
  } = useHistory({ 
    canvas,
    saveCallback
  });

  const { copy, paste } = useClipboard({ canvas });

  const { autoZoom } = useAutoResize({
    canvas,
    container,
  });

  useCanvasEvents({
    save,
    canvas,
    setSelectedObjects,
    clearSelectionCallback,
  });

  useHotkeys({
    undo,
    redo,
    copy,
    paste,
    save,
    canvas,
  });

  useLoadState({
    canvas,
    autoZoom,
    initialState,
    canvasHistory,
    setHistoryIndex,
  });

  const editor = useMemo(() => {
    if (!canvas) return undefined;

    return buildEditor({
      save,
      undo,
      redo,
      canUndo,
      canRedo,
      autoZoom,
      copy,
      paste,
      canvas,
      fillColor,
      strokeWidth,
      strokeColor,
      setFillColor,
      setStrokeColor,
      setStrokeWidth,
      strokeDashArray,
      selectedObjects,
      setStrokeDashArray,
      fontFamily,
      setFontFamily,
    });
  }, [
    canRedo,
    canUndo,
    undo,
    redo,
    save,
    autoZoom,
    copy,
    paste,
    canvas,
    fillColor,
    strokeWidth,
    strokeColor,
    selectedObjects,
    strokeDashArray,
    fontFamily,
  ]);

  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#3b82f6",
        borderScaleFactor: 1.5,
        transparentCorners: false,
        borderOpacityWhenMoving: 1,
        cornerStrokeColor: "#3b82f6",
      });

      const initialWorkspace = new fabric.Rect({
        width: initialWidth.current,
        height: initialHeight.current,
        name: "clip",
        fill: "white",
        selectable: false,
        hasControls: false,
        shadow: new fabric.Shadow({
          color: "rgba(0,0,0,0.8)",
          blur: 5,
        }),
      });

      initialCanvas.setWidth(initialContainer.offsetWidth);
      initialCanvas.setHeight(initialContainer.offsetHeight);

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);
      initialCanvas.clipPath = initialWorkspace;

      setCanvas(initialCanvas);
      setContainer(initialContainer);

      const currentState = JSON.stringify(initialCanvas.toJSON(JSON_KEYS));
      canvasHistory.current = [currentState];
      setHistoryIndex(0);
    },
    [canvasHistory, setHistoryIndex]
  );

  return { init, editor };
};

