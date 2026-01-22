import { availableParallelism } from 'os';
import WebServer from './WebServer.js';
import ClusterInstance, { RecycledWorker } from "@entity-access/server-pages/dist/ClusterInstance.js";
import sleep from './core/sleep.js';
import { dirname } from 'path';
import ensureDir from './core/FileApi.js';
import { existsSync, unlinkSync } from 'fs';

const numCPUs = process.env.SOCIAL_MAIL_CLUSTER_WORKERS
            ? Number(process.env.SOCIAL_MAIL_CLUSTER_WORKERS)
            : availableParallelism();

export default class WebCluster extends ClusterInstance<typeof WebServer> {

    public static start(arg: typeof WebServer = WebServer) {
        const c = new WebCluster();
        c.run(arg);
    }

    protected async runPrimary(): Promise<void> {

        let port = (process.env.PORT || "8080") as any;
        if (/^\d+$/.test(port)) {
            port = Number(port) as any;
        } else {
            const dir = dirname(port);
            ensureDir(dir);
            if(existsSync(port)) {
                unlinkSync(port);
            }
        }

        while(true) {
            const workers = [] as RecycledWorker[];
            console.log(`Creating cluster ${numCPUs} workers`);
            for (let index = 0; index < numCPUs; index++) {
                workers.push(this.fork({ port: 8081 }));
            }

            // sleep for 30 days
            for (let index = 0; index < 30; index++) {
                await sleep(24*60*60*1000);
            }

            for (const worker of workers) {
                worker.destroy();
            }
        }
    }
    protected async runWorker(arg: typeof WebServer): Promise<void> {
        console.log(`Worker started`);
        const ws = new arg();
        await ws.create();
    }

}