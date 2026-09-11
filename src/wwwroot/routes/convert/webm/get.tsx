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
        /**
         * https://stackoverflow.com/questions/6954845/how-to-create-a-webm-video-file
         * */
        await spawnPromise("/ffmpeg/ffmpeg", [
            "-i",
            input.path,
            "-c:v",
            "libvpx",
            "-crf",
            "10",
            "-b:v",
            "1M",
            "-c:a",
            "libvorbis",
            ... args,
            "-y",
            output.path
        ]);

        return output;
    }

}