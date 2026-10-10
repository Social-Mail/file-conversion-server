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

        const output = job.get(outputFileName);

        if(!output.exists) {
            console.log(`File not found ${output.path}`);
            return this.notFound(true);
        }

        console.log(`Sending file ${output.path}`);

        return new TempFileResult(output);

    }
}