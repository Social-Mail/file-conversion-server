import { FaceResult } from "@vladmandic/human";

export default class FaceInfo {

    box: {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    constructor(f: FaceResult) {
        const [x,y,width,height] = f.box;
        this.box = { x, y, width, height };
    }
}