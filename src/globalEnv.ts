
let port = (process.env.PORT || "8080") as any;
if(/^\d+$/i.test(port)) {
    port = Number(port);
}

const globalEnv = {
    port,
    debug: /yes|true/i.test(process.env.FCS_DEBUG),
    jobsFolder: process.env.FCS_JOBS_FOLDER || "/data/jobs",
    removeBg: {
        rembg: {
            host: process.env.FCS_REMOVE_BG_REMBG_HOST || "file-conversion-server-remove-bg",
            port: process.env.FCS_REMOVE_BG_REMBG_PORT || 7000
        }
    }

};

export default globalEnv;