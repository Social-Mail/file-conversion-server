import { Route } from "@entity-access/server-pages/dist/core/Route.js";
import Page from "@entity-access/server-pages/dist/Page.js";
import { tempDiskCache } from "../../../../../core/tempDiskCache.js";

export default class extends Page {

    @Route
    id: string;

    async run() {

        const { id } = this;

        const job = await tempDiskCache.get(`jobs/${id}/job.json`);
        const jobInfo = JSON.parse(await job.readAsText());

        const { outputPath } = jobInfo;
        const output = await tempDiskCache.get(outputPath);
        if(!output) {

            const failed = await tempDiskCache.get(`jobs/${id}/failed`);
            jobInfo.status = failed ? "failed" : "pending";
        } else {
            jobInfo.status = "ready";
        }
        return this.json(jobInfo);
    }
}