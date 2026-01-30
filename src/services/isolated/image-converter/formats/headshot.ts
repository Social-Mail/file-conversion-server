/* eslint-disable no-bitwise */
import sharp from "sharp";
import detect from "./detect700.js";

export default async function (file: { path: string }, ... args: any[] ): Promise<sharp.Sharp> {

    const size = {
        failOnError: false,
    } as any;

    try {

        const input = file.path;

        const aspect = 2000 / 3010;

        // create temp with 20% size...
        let {
            width,
            height
        } = await sharp(input).metadata();

        if (width > height) {
            width = height * aspect;
        } else {
            height = width / aspect;
        }

        const faces = await detect(input);
        if (faces?.length === 1) {

            // extract with keeping face in center...
            // const face = faces.sort((a, b) => a.score === b.score ? 0 : (
            //     a.score > b.score
            //     ? 1
            //     : -1
            // ))[0];
            const face = faces[0];

            const headshotHeight = face.box.height * 4 / 1.6;
            const headshotWidth = headshotHeight * width / height;
            const headshotLeft = (face.box.left + face.box.width / 2) - (headshotWidth / 2);
            const headshotTop = (face.box.top + face.box.height / 2) - (headshotHeight / 3);

            const rect = {
                left: ~~headshotLeft,
                top : ~~headshotTop,
                width: ~~headshotWidth,
                height: ~~headshotHeight
            };

            // tslint:disable-next-line: no-console
            console.log({
                originalFace: face.box,
                rect
            });

            return await sharp(input)
                .extract(rect)
                .png();
        }

        return await sharp(input)
        .resize(width, height, {
            fit: sharp.fit.cover,
            position: sharp.strategy.attention
        })
        .png();
    } catch (e) {
        console.log(e.stack ?? e);
        const err = `${JSON.stringify(size)}\n${e.stack ? e.stack : e}`;
        throw new Error(err);
    }
}