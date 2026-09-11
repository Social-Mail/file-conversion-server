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
            "-vf",
            "scale=1280:-2",
            "-c:v",
            "libx264",
            "-crf",
            "23",
            "-profile:v",
            "high",
            "-level",
            "4.1",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            ... args,
            "-y",
            output.path
        ]);


        return output;
    }

}