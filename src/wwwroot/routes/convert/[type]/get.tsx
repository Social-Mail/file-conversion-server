import Inject from "@entity-access/entity-access/dist/di/di.js";
import Page from "@entity-access/server-pages/dist/Page.js";
import { Route } from "@entity-access/server-pages/dist/core/Route.js";
import FileConversionService from "../../../../services/convert/FileConversionService.js";
import { Query } from "@entity-access/server-pages/dist/core/Query.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { TempFileResult } from "@entity-access/server-pages/dist/Content.js";
import { CORS } from "../../../../core/CORS.js";
import { tempDiskCache } from "../../../../core/tempDiskCache.js";
import { parse } from "path";
import { Readable } from "stream";

export default class extends Page {

    @Route
    type: string;

    @Query
    senderDomain: string;

    @Query
    filePath: string;

    @Query
    sourceUrl: string;

    @Inject
    fcs: FileConversionService;

    async run() {

        console.log(`HTTP-in: ${this.request.url}`);

        const fileName = this.childPath[this.childPath.length-1];
        const { senderDomain, type } = this;

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

        const file = await this.fcs.downloadConvertedFile({ input, fileName, senderDomain, type  });

        this.registerDisposable(file);

        return new TempFileResult(
            file, {
                contentDisposition: type === "download"
                    ? "attachment"
                    : "inline",
                immutable: true,
                etag: false,
                headers: CORS.allowAll
            },
        );
    }
}