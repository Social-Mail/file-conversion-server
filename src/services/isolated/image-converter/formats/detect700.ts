import sharp from "sharp";
import type { Box, FaceDetection } from "face-api.js";
import { Canvas, loadImageData, Window } from "../../../../common/env.js";
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
        .png();

    const img = await loadImageData(imgSmall);

    const canvas = new Canvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const detections: FaceDetection[] = await faceApi.detectAllFaces(canvas as any, faceDetectionOptions);
    return detections.map((s) => ({
        score: s.score,
        box: s.box.rescale(scale)
    }));
}
