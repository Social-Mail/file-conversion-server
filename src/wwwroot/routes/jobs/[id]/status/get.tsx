import { Route } from "@entity-access/server-pages/dist/core/Route.js";
import Page from "@entity-access/server-pages/dist/Page.js";
import { JobFolder } from "../../../../../core/tempDiskCache.js";

export default class extends Page {

    @Route
    id: string;

    async run() {

        const { id } = this;

        const jobFolder = JobFolder.from(id);

        const job = jobFolder.get("job.json");
        const jobInfo = JSON.parse(await job.readAsText());

        const { outputPath } = jobInfo;
        const output = jobFolder.get(outputPath);
        if(!output.exists) {

            const failed = await jobFolder.get(`failed`);
            jobInfo.state = failed.exists ? "failed" : "pending";
        } else {
            jobInfo.state = "ready";
        }
        return this.json(jobInfo);
    }
}