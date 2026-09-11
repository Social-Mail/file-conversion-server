import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { spawnPromise } from "../../core/spawnPromise.js";

export default class FFCommand {

    public static async thumbnail(file: LocalFile, output: LocalFile, time = 0.5) {

        /**
         * https://stackoverflow.com/questions/27145238/create-thumbnail-from-video-using-ffmpeg
         * */
        await spawnPromise("/ffmpeg/ffmpeg", [
            "-i",
            file.path,
            "-ss",
            "00:00:01.000",
            "-vframes",
            "1",
            "-y",
            output.path
        ]);

        return output;
    }

}