import Page from "@entity-access/server-pages/dist/Page.js";
import { tempDiskCache } from "../../../core/tempDiskCache.js";
import { randomUUID } from "node:crypto";
import { Query } from "@entity-access/server-pages/dist/core/Query.js";
import { Agent, Dispatcher, fetch } from "undici";
import globalEnv from "../../../globalEnv.js";
import EntityAccessError from "@entity-access/entity-access/dist/common/EntityAccessError.js";
import ServerLogger from "@entity-access/server-pages/dist/core/ServerLogger.js";

let dispatcher: Dispatcher;

export default class extends Page {


    @Query
    sourceUrl: string;
    @Query
    type: string;
    @Query
    outputFileName: string;

    async run() {

        const id = randomUUID();

        const { sourceUrl, type, outputFileName } = this;

        const job = await tempDiskCache.create(`jobs/${id}/job.json`);

        const jobInfo = {
            id,
            sourceUrl,
            type,
            outputPath: `jobs/${id}/${outputFileName}`,
            outputFileName,
            status: `/jobs/${id}/status/${outputFileName}`,
            output: `/jobs/${id}/download/${outputFileName}`
        };

        dispatcher ??= new Agent({
            socketPath: globalEnv.port
        });

        const url = new URL(`http://localhost/convert/${type}/${outputFileName}`);
        url.searchParams.append("outputPath", jobInfo.outputPath);

        // fire and forget...
        fetch(url.toString(), {
            dispatcher
        }).catch(ServerLogger.error);


        await job.writeAllText(JSON.stringify(jobInfo));



        return this.json(jobInfo);

    }
}