import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { spawnPromise } from "../../core/spawnPromise.js";
import { contentFolder } from "../../core/ImagesFolder.js";

export default class FFCommand {

    static async webm(file: LocalFile, output: LocalFile, args: string[] = []) {
        /**
         * https://stackoverflow.com/questions/6954845/how-to-create-a-webm-video-file
         * */
        await spawnPromise("/ffmpeg/ffmpeg", [
            "-i",
            file.path,
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


    static async webmText(file: LocalFile, text: string, output: LocalFile, args: string[] = []) {
        /**
         * https://stackoverflow.com/questions/6954845/how-to-create-a-webm-video-file
         * */

        const fontFile = contentFolder.file("fonts", "roboto", "RobotizationMono-Regular.ttf");

        text = text.replaceAll(":", "\\\\\\:");

        const filter = `drawtext=fontfile=${fontFile}:text='${text}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-th-40`;

        await spawnPromise("/ffmpeg/ffmpeg", [
            "-i",
            file.path,
            "-c:v", "libvpx",
            "-crf", "10",
            "-b:v", "1M",
            "-c:a", "libvorbis",
            "-vf", filter,
            ... args,
            "-y",
            output.path
        ]);

        return output;
    }

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