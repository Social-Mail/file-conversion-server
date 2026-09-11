import LockFile from "../../../../core/LockFile.js";
import { spawnPromise } from "../../../../core/spawnPromise.js";
import BaseConverterPage, { IConvertParams } from "../BaseConverterPage.js";

export default class extends BaseConverterPage {

    async convert({
        input,
        output,
        args
    }: IConvertParams) {

        using _lock = await LockFile.lock("video-conversion");

        await spawnPromise("/ffmpeg/ffmpeg", [
            "-i",
            input.path,
            "-vcodec","libwebp",
            "-lossless", "0",
            "-compression_level", "6",
            "-q:v", "82",
            "-g", "60",
            "-preset", "picture",
            "-loop", "0",
            ... args,
            "-y",
            output.path
        ]);

        return output;
    }

}