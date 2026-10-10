import { Route } from "@entity-access/server-pages/dist/core/Route.js";
import Page from "@entity-access/server-pages/dist/Page.js";
import { JobFolder } from "../../../../../core/tempDiskCache.js";
import { TempFileResult } from "@entity-access/server-pages/dist/Content.js";

export default class extends Page {

    @Route
    id: string;

    async run() {
        const { id } = this;

        const job = await JobFolder.from(id);
        const jobInfo = JSON.parse(await job.get("job.json").readAsText());

        const { outputFileName } = jobInfo;

        const output = await job.get(outputFileName);

        return new TempFileResult(output);

    }
}