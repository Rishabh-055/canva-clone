import { fabric } from "fabric";
import type { RGBColor } from "react-color";

export function transformText(objects: any[]) {
  if (!objects || !Array.isArray(objects)) return;

  for (const item of objects) {
    if (item.objects) {
      transformText(item.objects);
    } else if (item.type === "text") {
      item.type = "textbox";
    }
  }
}

export function downloadFile(fileUrl: string, fileExtension: string) {
  const fileName = `${crypto.randomUUID()}.${fileExtension}`;
  const downloadLink = document.createElement("a");

  downloadLink.href = fileUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
}

export function isTextType(type?: string): boolean {
  return type === "text" || type === "i-text" || type === "textbox";
}

export function rgbaObjectToString(rgba: RGBColor | "transparent"): string {
  if (rgba === "transparent") {
    return "rgba(0,0,0,0)";
  }

  const alpha = rgba.a ?? 1;
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
}

export const createFilter = (filterName: string) => {
  switch (filterName) {
    case "greyscale":
      return new fabric.Image.filters.Grayscale();
    case "polaroid":
      // @ts-ignore
      return new fabric.Image.filters.Polaroid();
    case "sepia":
      return new fabric.Image.filters.Sepia();
    case "kodachrome":
      // @ts-ignore
      return new fabric.Image.filters.Kodachrome();
    case "contrast":
      return new fabric.Image.filters.Contrast({ contrast: 0.3 });
    case "brightness":
      return new fabric.Image.filters.Brightness({ brightness: 0.8 });
    case "brownie":
      // @ts-ignore
      return new fabric.Image.filters.Brownie();
    case "vintage":
      // @ts-ignore
      return new fabric.Image.filters.Vintage();
    case "technicolor":
      // @ts-ignore
      return new fabric.Image.filters.Technicolor();
    case "pixelate":
      return new fabric.Image.filters.Pixelate();
    case "invert":
      return new fabric.Image.filters.Invert();
    case "blur":
      return new fabric.Image.filters.Blur();
    case "sharpen":
      return new fabric.Image.filters.Convolute({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      });
    case "emboss":
      return new fabric.Image.filters.Convolute({
        matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1],
      });
    case "removecolor":
      // @ts-ignore
      return new fabric.Image.filters.RemoveColor({
        threshold: 0.2,
        distance: 0.5,
      });
    case "blacknwhite":
      // @ts-ignore
      return new fabric.Image.filters.BlackWhite();
    case "vibrance":
      // @ts-ignore
      return new fabric.Image.filters.Vibrance({ vibrance: 1 });
    case "blendcolor":
      return new fabric.Image.filters.BlendColor({
        color: "#00ff00",
        mode: "multiply",
      });
    case "huerotate":
      return new fabric.Image.filters.HueRotation({ rotation: 0.5 });
    case "resize":
      return new fabric.Image.filters.Resize();
    case "gamma":
      // @ts-ignore
      return new fabric.Image.filters.Gamma({ gamma: [1, 0.5, 2.1] });
    case "saturation":
      return new fabric.Image.filters.Saturation({ saturation: 0.7 });
    default:
      return null;
  }
};

