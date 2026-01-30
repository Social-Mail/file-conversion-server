// import nodejs bindings to native tensorflow,
// not required, but will speed up things drastically (python required)
// import '@tensorflow/tfjs-node';
// import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-wasm";
import faceapi from "./faceapi.js";

// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
import { Canvas, Image, ImageData, loadImageData, Window } from "skia-canvas";

faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

export { Canvas, Image, ImageData, loadImageData, Window };
