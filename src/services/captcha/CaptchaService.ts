import { RegisterSingleton } from "@entity-access/entity-access/dist/di/di.js";
import BaseDiskCache from "../../core/BaseDiskCache.js";
import ensureDir from "../../core/FileApi.js";
import FileSize from "../../core/FileSize.js";
import { spawnPromise } from "../../core/spawnPromise.js";
import { tempDiskCache } from "../../core/tempDiskCache.js";
import path from "node:path";

const captchaCache = path.join("/cache", "captcha");;
ensureDir(captchaCache);

const tempSize = FileSize.parse("10gb");
const minSize = tempSize / 2;

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

@RegisterSingleton
export default class CaptchaService  {

    diskCache = new BaseDiskCache({
        root: captchaCache,
        keepTTLSeconds: 7*86400,
        minSize,
        maxAge: 7
    })

    async getVideo(code: string) {
        return this.diskCache.getOrCreateAsync(code + ".gif", async (cf) => {

            const input = "/app/content/video/all.webm";
            const tf = tempDiskCache.createTempFile("code.webm", "video/webm");            
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
        
            await spawnPromise("/ffmpeg/ffmpeg", [
                "-i", tf.path,
                "-filter:v", "scale=300:-1",
                "-y", cf.path
            ],{
                logData: false,
                logCommand: false,
            });
        });
    }
}