import { Config, Human } from "../../../../../node_modules/@vladmandic/human/dist/human.node.js";
import FaceInfo from "./FaceInfo.js";

import { Canvas, loadImage } from "skia-canvas";

export default async function detect(input): Promise<FaceInfo[]> {


    const config: Partial<Config> = {
        backend: 'wasm', // Use the optimized node backend
        face: {
            enabled: true,
        },
        modelBasePath: import.meta.resolve("../../../../../node_modules/@vladmandic/human/models/")
    };

    const human = new Human(config);
    await human.load();

    // const tensor = tf..decodeImage(await readFile(input), 3);

    const image = await loadImage(input);

    const canvas = new Canvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const result = await human.detect(canvas as any);
    return result.face.map((x) => new FaceInfo(x));
}
