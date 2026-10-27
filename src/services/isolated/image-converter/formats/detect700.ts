import tf from '@tensorflow/tfjs-node';
import { Config, Human } from '@vladmandic/human';
import { readFile } from "node:fs/promises";
import FaceInfo from "./FaceInfo.js";


export default async function detect(input): Promise<FaceInfo[]> {

    const config: Partial<Config> = {
        backend: 'wasm', // Use the optimized node backend
        face: {
            enabled: true,
        },
    };

    const human = new Human(config);
    await human.load();

    const tensor = tf.node.decodeImage(await readFile(input), 3);

    const result = await human.detect(tensor);
    return result.face.map((x) => new FaceInfo(x));
}
