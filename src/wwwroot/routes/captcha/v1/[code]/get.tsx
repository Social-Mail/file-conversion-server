import Page from "@entity-access/server-pages/dist/Page.js";
import { tempDiskCache } from "../../../../../core/tempDiskCache.js";
import { Route } from "@entity-access/server-pages/dist/core/Route.js";
import { spawnPromise } from "../../../../../core/spawnPromise.js";
import { TempFileResult } from "@entity-access/server-pages/dist/Content.js";
import { CORS } from "../../../../../core/CORS.js";

const zero = '0'.charCodeAt(0);

const filter = "[0]pad=width=750:height=200:x=0:y=0:color=white[v0];"
				+ "[0][1]hstack=inputs=2[i1];"
				+ "[i1]pad=width=750:height=200:x=0:y=0:color=white[v1];"
				+ "[0][1][2]hstack=inputs=3[i2];"
				+ "[i2]pad=width=750:height=200:x=0:y=0:color=white[v2];"
				+ "[0][1][2][3]hstack=inputs=4[i3];"
				+ "[i3]pad=width=750:height=200:x=0:y=0:color=white[v3];"
				+ "[0][1][2][3][4]hstack=inputs=5[i4];"
				+ "[i4]pad=width=750:height=200:x=0:y=0:color=white[v4];"
				+ "[v0][v1][v2][v3][v4]concat=n=5:v=1,format=yuv420p[v]";

export default class extends Page {

    @Route
    code: string;

    async run() {

        const { code } = this;

        await using tf = tempDiskCache.createTempFile(".webm", "code", "video/webm");

        const input = "/app/content/video/all.webm";

        await spawnPromise("/ffmpeg/ffmpeg", [
            "-ss", ((code.charCodeAt(0) - zero) * 3.5).toString(), "-t", "3.5", "-i", input,
            "-ss", ((code.charCodeAt(1) - zero) * 3.5).toString(), "-t", "3.5", "-i", input,
            "-ss", ((code.charCodeAt(2) - zero) * 3.5).toString(), "-t", "3.5", "-i", input,
            "-ss", ((code.charCodeAt(3) - zero) * 3.5).toString(), "-t", "3.5", "-i", input,
            "-ss", ((code.charCodeAt(4) - zero) * 3.5).toString(), "-t", "3.5", "-i", input,
            "-filter_complex", filter,
            "-map", "[v]",
             "-y", tf.path
        ], {
            logData: false,
            logCommand: false,
        });

        const saveAs = tempDiskCache.createTempFile(".gif", "code", "image/gif")

        await spawnPromise("/ffmpeg/ffmpeg", [
            "-i", tf.path,
            "-filter:v", "scale=300:-1",
            "-y", saveAs.path
        ],{
            logData: false,
            logCommand: false,
        });

        this.disposables.push({ [Symbol.dispose]() {
            saveAs[Symbol.asyncDispose]().catch(console.error);
        }})

        return new TempFileResult(
            saveAs, {
                contentDisposition: "inline",
                immutable: true,
                etag: false,
                headers: CORS.allowAll
            },
        );
    }
}