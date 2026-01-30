/* eslint-disable no-bitwise */
import sharp from "sharp";
import detect from "./detect700.js";

export default async function (file: { path: string }, ... args: any[] ): Promise<sharp.Sharp> {

    const size = {
        failOnError: false,
    } as any;

    try {

        const input = file.path;

        // create temp with 20% size...
        const faces = await detect(input);
        return faces as any;
    } catch (e) {
        console.log(e.stack ?? e);
        const err = `${JSON.stringify(size)}\n${e.stack ? e.stack : e}`;
        throw new Error(err);
    }
}