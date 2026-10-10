import Page from "@entity-access/server-pages/dist/Page.js";
import { tempDiskCache } from "../../../../../../core/tempDiskCache.js";
import { randomUUID } from "node:crypto";
import { Query } from "@entity-access/server-pages/dist/core/Query.js";
import { Agent, Dispatcher, fetch } from "undici";
import globalEnv from "../../../../../../globalEnv.js";
import ServerLogger from "@entity-access/server-pages/dist/core/ServerLogger.js";
import { Route } from "@entity-access/server-pages/dist/core/Route.js";

let dispatcher: Dispatcher;

export default class extends Page {

    @Route
    type: string;

    @Route
    outputFileName: string;

    async run() {

        const id = randomUUID();

        const { type, outputFileName } = this;

        console.log(JSON.stringify({
            job: type,
            outputFileName
        }));

        const job = await tempDiskCache.create(`jobs/${id}/job.json`);

        const jobInfo = {
            id,
            url: this.url,
            type,
            outputPath: `jobs/${id}/${outputFileName}`,
            outputFileName,
            status: `/jobs/${id}/status/${outputFileName}`,
            output: `/jobs/${id}/download/${outputFileName}`
        };

        dispatcher ??= new Agent(typeof globalEnv.port === "number"
            ? {
                connect: {
                    port: globalEnv.port
                }
            }
            : {
                socketPath: globalEnv.port
            }
        );

        const url = new URL(`http://localhost/convert/${type}/${outputFileName}`);
        for(const [k,v] of this.request.URL.searchParams.entries()) {
            url.searchParams.append(k, v);
        }
        url.searchParams.set("outputPath", jobInfo.outputPath);

        // fire and forget...
        fetch(url.toString(), {
            dispatcher
        }).catch(ServerLogger.error);


        await job.writeAllText(JSON.stringify(jobInfo));



        return this.json(jobInfo);

    }
}