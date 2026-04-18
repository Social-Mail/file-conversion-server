/* eslint-disable no-bitwise */

import sharp from "sharp";
import globalEnv from "../../../../globalEnv.js";
import { readFile } from "fs/promises";
import { parse } from "path";

export default async function (file: { path: string }, ...args: any[]): Promise<sharp.Sharp> {

    const size = {
        failOnError: false,
    } as any;

    try {

        const input = file.path;
        const url = new URL(`http://${globalEnv.removeBg.rembg.host}:${globalEnv.removeBg.rembg.port}/api/remove`);

        const params = url.searchParams;
        for(let i=0;i<args.length;i+=2) {
            const key = args[i];
            if(!key) {
                break;
            }
            let v = args[i+1];
            if (v.startsWith('"')) {
                v = JSON.parse(v);
            }
            params.set(key, v );
        }

        const body = new FormData();

        const buffer = await readFile(input);

        const { base: fileName } = parse(file.path);

        body.append("file", new File([ buffer], fileName ))

        const r = await fetch(url, {
            body
        });

        const output = await r.arrayBuffer();

        return await sharp(output);
    } catch (e) {
        console.log(e.stack ?? e);
        const err = `${JSON.stringify(size)}\n${e.stack ? e.stack : e}`;
        throw new Error(err);
    }
}