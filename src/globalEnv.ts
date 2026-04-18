const globalEnv = {

    debug: /yes|true/i.test(process.env.FCS_DEBUG),
    removeBg: {
        rembg: {
            host: process.env.FCS_REMOVE_BG_REMBG_HOST || "file-conversion-server-remove-bg",
            port: process.env.FCS_REMOVE_BG_REMBG_PORT || 7000
        }
    }

};

export default globalEnv;