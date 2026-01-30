import sharp from "sharp";
import { Box, FaceDetection } from "@vladmandic/face-api";
import { canvas } from "../../../../common/env.js";
import { faceDetectionNet, faceDetectionOptions } from "../../../../common/faceDetection.js";
import faceApi from "../../../../common/faceapi.js";

export interface IFace {
    score: number;
    box: Box;
}

export default async function detect(input): Promise<IFace[]> {

    await faceApi.tf.setBackend("wasm");

    await faceDetectionNet.loadFromDisk("/app/models");

    const { height } = await sharp(input).metadata();
    const scale = height / 700;
    const imgSmall =
        await sharp(input)
        .resize({ height: 700 })
        .png()
        .toBuffer();

    const img: any = await canvas.loadImage(imgSmall);
    const detections: FaceDetection[] = await faceApi.detectAllFaces(img, faceDetectionOptions);
    return detections.map((s) => ({
        score: s.score,
        box: s.box.rescale(scale)
    }));
}
