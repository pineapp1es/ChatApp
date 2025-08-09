import { logger } from "@utils/loggerUtil.ts";
import { exit } from "process";


export const handleError = (err: any, action: string, fatal: boolean = false) => {
    if (fatal)
        logger.error("!!! FATAL ERROR !!!")
    logger.error("Occured while: " + action + "\n" + err);
    if (fatal)
        exit();
}
