import Inject from "@entity-access/entity-access/dist/di/di.js";
import Page from "@entity-access/server-pages/dist/Page.js";
import { Route } from "@entity-access/server-pages/dist/core/Route.js";
import FileConversionService from "../../../../services/convert/FileConversionService.js";
import { Query } from "@entity-access/server-pages/dist/core/Query.js";
import { LocalFile } from "@entity-access/server-pages/dist/core/LocalFile.js";
import { TempFileResult } from "@entity-access/server-pages/dist/Content.js";
import { CORS } from "../../../../core/CORS.js";

export default class extends Page {

    @Route
    type: string;

    @Query
    senderDomain: string;

    @Query
    filePath: string;

    @Inject
    fcs: FileConversionService;

    async run() {
        const fileName = this.childPath[this.childPath.length-1];
        const { senderDomain, type } = this;

        const input = new LocalFile(this.filePath, void 0, void 0, () => void 0);

        const file = await this.fcs.downloadConvertedFile({ input, fileName, senderDomain, type  });

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