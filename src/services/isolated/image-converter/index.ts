/* eslint-disable no-console */
import sharp from "sharp";
import { parse } from "path";
import IImageConverter from "./IImageConverter.js";

async function transform({
        type,
        input,
        output,
        outputFileName = "file.jpg"
    }: IImageConverter
) {

    let { ext } = parse(outputFileName);
    let fileName = type;
    const matches = type.match(/(\w+)\(?([^\)]*)\)?/);
    let args = [];
    if (matches) {
        fileName = matches[1];
        args = matches[2].split(',').map( (x) => /^\d/.test(x) ? parseFloat(x) : x);
        switch(fileName) {
            case "jpg":
                ext = ".jpg";
                fileName = "size";
                break;
            case "png":
                ext = ".png";
                fileName = "size";
                break;
            case "gif":
                ext = ".gif";
                fileName = "size";
                break;
            case "webp":
                ext = ".webp";
                fileName = "size";
                break;
            case "ico":
                ext = ".ico";
                fileName = "size";
                break;
        }
    }

    const { default: fx } = await import("./formats/" + fileName + ".js");
    let r: sharp.Sharp = await fx(input, ... args);

    switch(ext) {
        case ".jpg":
            r = r.jpeg({ quality: 95});
            break;
        case ".png":
            r = r.png({
                compressionLevel: 9
            });
            break;
        case ".webp":
            r = r.webp({
                nearLossless: true,
                quality: 95
            });
            break;
        case ".gif":
            r = r.gif();
            break;
    }

    await r.toFile(output.path);
}

const [_execPath, _self, p] = process.argv;

transform(JSON.parse(p))
    .catch(console.error);