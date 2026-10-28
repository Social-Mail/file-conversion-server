import * as tf from '@tensorflow/tfjs-node'; 
import { Config, Human } from "../../../../../node_modules/@vladmandic/human/dist/human.node.js";
import FaceInfo from "./FaceInfo.js";
import { readFile } from 'node:fs/promises';

export default async function detect(input): Promise<FaceInfo[]> {


    const config: Partial<Config> = {
        backend: 'tensorflow', // Use the optimized node backend
        face: {
            enabled: true,
        },
        modelBasePath: import.meta.resolve("../../../../../node_modules/@vladmandic/human/models/")
    };

    const human = new Human(config);
    await human.load();

    const image = await tf.node.decodeImage(await readFile(input), 3);
    const result = await human.detect(image);
    return result.face.map((x) => new FaceInfo(x));
}
