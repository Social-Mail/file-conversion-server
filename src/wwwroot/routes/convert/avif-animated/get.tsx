import LockFile from "../../../../core/LockFile.js";
import { spawnPromise } from "../../../../core/spawnPromise.js";
import BaseConverterPage from "../BaseConverterPage.js";

export default class extends BaseConverterPage {

    async convert({
        input,
        output,
        args
    }) {

        using _lock = await LockFile.lock("video-conversion");

        await spawnPromise("/ffmpeg/ffmpeg", [
            "-i",
            input.path,
            "-vf", "fps=25",
            "-c:v", "libsvtav1",
            "-crf", "12",
            "-an",
            "-loop", "0",
            ... args,
            "-y",
            output.path
        ]); 

        return output;
    }

}