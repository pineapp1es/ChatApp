export const loggingLevels = {
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    ALL: 5,
    NONE: 0
} as const;
type logLevelsType = (typeof loggingLevels)[keyof typeof loggingLevels];

const loggerClass = class loggerClass {
    #level: logLevelsType;

    constructor(level: logLevelsType = loggingLevels.ALL) {
        this.#level = level;
    }

    debug (...message: Array<string>) {
        if (this.#level >= loggingLevels.DEBUG)
            console.debug("[DEBUG] " + message);
    };

    log (...message: Array<string>) {
       if (this.#level >= loggingLevels.INFO)
           console.log("[INFO] " + message);
    };

    info (...message: Array<string>) {
       if (this.#level >= loggingLevels.INFO)
           console.log("[INFO] " + message);
    };

    warn (...message: Array<string>) {
       if (this.#level >= loggingLevels.WARN)
           console.log("[WARN] " + message);
    };

    error (...message: Array<string>) {
       if (this.#level >= loggingLevels.ERROR)
           console.log("[ERROR] " + message);
    };

    setLogLevel (level: logLevelsType) {
        this.#level = level;
    }
}

export const logger = new loggerClass(loggingLevels.ALL);
