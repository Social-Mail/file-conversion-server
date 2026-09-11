import Inject from "@entity-access/entity-access/dist/di/di.js";
import { TempFileResult } from "@entity-access/server-pages/dist/Content.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { Query } from "@entity-access/server-pages/dist/core/Query.js";
import Page from "@entity-access/server-pages/dist/Page.js";
import { parse } from "path";
import { Readable } from "stream";
import { CORS } from "../../../core/CORS.js";
import { tempDiskCache } from "../../../core/tempDiskCache.js";
import debugLog from "../../../debugLog.js";
import FileConversionService from "../../../services/convert/FileConversionService.js";

export interface IConvertParams {
    input: LocalFile;
    output: LocalFile;
    fileName: string;
    senderDomain: string;
    args: string[];
}

export default abstract class BaseConverterPage extends Page {

    abstract convert(p:IConvertParams): Promise<LocalFile>; 

    @Query
    senderDomain: string;

    @Query
    filePath: string;

    @Query
    sourceUrl: string;

    @Query
    args: string;

    @Inject
    fcs: FileConversionService;

    async run() {

        console.log(`HTTP-in: ${this.request.url}`);

        const fileName = this.childPath[this.childPath.length-1];
        const { senderDomain } = this;

        let input = null as LocalFile;

        if (this.sourceUrl) {
            const u = new URL(this.sourceUrl);
            const { base } = parse(u.pathname);
            input = tempDiskCache.createTempFile(base);
            const rs = await fetch(this.sourceUrl);
            await input.writeAll(Readable.fromWeb(rs.body as any));
        } else {
            input = new LocalFile(this.filePath, void 0, void 0, () => void 0);
        }

        debugLog?.(`Converting file ${input.path}`);

        const output = await tempDiskCache.createTempFile(fileName);

        const args = JSON.parse(this.args || "[]");

        const file = await this.convert({ input, fileName, senderDomain, output, args });

        
        debugLog?.(`File ${input} converted`);
        

        this.registerDisposable(file);

        debugLog?.(`Sending ${file.path}`);

        return new TempFileResult(
            file, {
                contentDisposition: "inline",
                immutable: true,
                etag: false,
                headers: CORS.allowAll
            },
        );
    }
} 