// import nodejs bindings to native tensorflow,
// not required, but will speed up things drastically (python required)
// import '@tensorflow/tfjs-node';
// import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-wasm";
import faceapi from "./faceapi.js";

// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
import { Canvas, Image, ImageData, loadImageData } from "skia-canvas";

(faceapi as any).env.monkeyPatch({ Canvas, Image, ImageData });

export { Canvas, Image, ImageData, loadImageData };
