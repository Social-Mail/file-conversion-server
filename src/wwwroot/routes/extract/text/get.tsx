import Inject from "@entity-access/entity-access/dist/di/di.js";
import Page from "@entity-access/server-pages/dist/Page.js";
import { Query } from "@entity-access/server-pages/dist/core/Query.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { TempFileResult } from "@entity-access/server-pages/dist/Content.js";
import { CORS } from "../../../../core/CORS.js";
import { tempDiskCache } from "../../../../core/tempDiskCache.js";
import { parse } from "path";
import { Readable } from "stream";
import TextExtractorService from "../../../../services/extract/TextExtractorService.js";

export default class extends Page {

    @Query
    filePath: string;

    @Query
    sourceUrl: string;

    @Inject
    tes: TextExtractorService;

    async run() {

        console.log(`HTTP-in: ${this.request.url}`);

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

        const file = await this.tes.extract(input);

       this.registerDisposable(file);

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