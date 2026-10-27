import tf from '@tensorflow/tfjs';
// 1. Crucial: Explicitly import the WASM backend so it registers with TFJS
import '@tensorflow/tfjs-backend-wasm'; 
import { Config, Human } from '@vladmandic/human';
import { readFile } from "node:fs/promises";
import FaceInfo from "./FaceInfo.js";

const init = (async () => {
    await tf.setBackend("wasm");
    await tf.ready();
})();

export default async function detect(input): Promise<FaceInfo[]> {

    const config: Partial<Config> = {
        backend: 'wasm', // Use the optimized node backend
        face: {
            enabled: true,
        },
    };

    await init;

    const human = new Human(config);
    await human.load();

    // const tensor = tf..decodeImage(await readFile(input), 3);

    const result = await human.detect(await readFile(input) as any);
    return result.face.map((x) => new FaceInfo(x));
}
