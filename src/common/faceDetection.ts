import faceApi from "./faceapi.js";


export const faceDetectionNet = faceApi.nets.ssdMobilenetv1;
// export const faceDetectionNet = faceapi.nets.tinyFaceDetector;

// SsdMobilenetv1Options
const minConfidence = 0.5;

// TinyFaceDetectorOptions
const inputSize = 448;
const scoreThreshold = 0.5;

function getFaceDetectorOptions(net) {
  return net === faceApi.nets.ssdMobilenetv1
    ? new faceApi.SsdMobilenetv1Options({ minConfidence })
    : new faceApi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
}

export const faceDetectionOptions = getFaceDetectorOptions(faceDetectionNet);
