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
    
            ... args,
            "-y",
            output.path
        ]);

        return output;
    }

}