/* eslint-disable no-bitwise */
import sharp from "sharp";

export default async function (file: { path: string }, ... args: any[] ): Promise<sharp.Sharp> {

    const size = {
        failOnError: false,
    } as any;

    try {

        const input = file.path;

        if (args.length === 0) {
            size.width = 0;
            size.height = 0;
        } else if (args.length === 1) {
            // tslint:disable-next-line: no-bitwise
            size.height = ~~args[0];
        } else {
            const [width, height, ... extra] = args;
            // tslint:disable-next-line: no-bitwise
            size.width = ~~width;
            // tslint:disable-next-line: no-bitwise
            size.height = ~~height;
            size.fit = "cover";
            for (let index = 0; index < extra.length / 2; index+=2) {
                const key = extra[index];
                const value = extra[index+1];
                if(key && value) {
                    size[key] = value;
                }
            }
        }

        if (size.height === 0 || size.width === 0) {
            return await (sharp(input, { animated: true, pages: -1}).rotate() as any);
        }
        return await (sharp(input, { animated: true, pages: -1}).rotate() as any)
        .resize(size);
    } catch (e) {
        console.log(e.stack ?? e);
        const err = `${JSON.stringify(size)}\n${e.stack ? e.stack : e}`;
        throw new Error(err);
    }
}