const globalEnv = {

    debug: /yes|true/i.test(process.env.FCS_DEBUG)

};

export default globalEnv;