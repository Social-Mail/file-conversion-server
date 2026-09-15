import { Route } from "@entity-access/server-pages/dist/core/Route.js";
import LockFile from "../../../../core/LockFile.js";
import { spawnPromise } from "../../../../core/spawnPromise.js";
import BaseConverterPage, { IConvertParams } from "../BaseConverterPage.js";

export default class extends BaseConverterPage {

    @Route
    size: any;

    async convert({
        input,
        output,
        args
    }: IConvertParams) {

        using _lock = await LockFile.lock("video-conversion");

        const { size } = this;

        const inputFile = input.path;

        // if(input.path.endsWith(".avif")) {
        //     inputFile += ".mp4";
        //     // rename to mp4 and assume ffmpeg will work correctly?
        //     await link (input.path, inputFile);
        //     this.registerDisposable({
        //         [Symbol.dispose]() {
        //             try {
        //                 unlinkSync(inputFile);
        //             } catch {

        //             }
        //         }
        //     });
        // }


        await spawnPromise("/ffmpeg/ffmpeg", [
            "-i",
            inputFile,
            `-map`,`0:v:1?`,`-map`,`0:v:0`,`-disposition:v:0 none`,
            "-vf", `scale='if(gt(ih,${size}),-2,iw)':'if(gt(ih,${size}),${size},ih)'`,
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