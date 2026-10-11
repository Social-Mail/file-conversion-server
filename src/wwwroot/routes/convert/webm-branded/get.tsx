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

            // 1. Switch from legacy libvpx (VP8) to standard modern VP9
            "-c:v", "libvpx-vp9",
            
            // 2. Crucial for iOS: Explicitly clamp the video profile to 8-bit, 4:2:0 format
            "-profile:v", "0",
            "-pix_fmt", "yuv420p",
            
            "-crf", "30", // VP9 scales differently than VP8; 30 provides great quality at 1M target
            "-b:v", "1M",
            
            // 3. Switch from legacy Vorbis to standard, iOS-supported Opus audio
            "-c:a", "libopus",
            "-b:a", "128k", // Provide a stable bit-rate mapping for media streams

            "-vf", filter,
            ... args,
            "-y",
            output.path
        ]);

        return output;
    }

}