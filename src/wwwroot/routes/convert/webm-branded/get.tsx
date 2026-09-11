import { contentFolder } from "../../../../core/ImagesFolder.js";
import LockFile from "../../../../core/LockFile.js";
import { spawnPromise } from "../../../../core/spawnPromise.js";
import BaseConverterPage, { IConvertParams } from "../BaseConverterPage.js";

export default class extends BaseConverterPage {

    async convert({
        input,
        output,
        senderDomain,
        args
    }: IConvertParams) {

        let text = "https://" + senderDomain;

        if (!/^(video|audio)\//i.test(input.contentType)) {
            throw new Error("Not an audio or video file");
        }

        using _lock = await LockFile.lock("video-conversion");

        const fontFile = contentFolder.file("fonts", "roboto", "RobotizationMono-Regular.ttf");

        text = text.replaceAll(":", "\\\\\\:");

        const filter = `drawtext=fontfile=${fontFile}:text='${text}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-th-40`;
        /**
         * https://stackoverflow.com/questions/6954845/how-to-create-a-webm-video-file
         * */
        await spawnPromise("/ffmpeg/ffmpeg", [
            "-i",
            input.path,
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

}