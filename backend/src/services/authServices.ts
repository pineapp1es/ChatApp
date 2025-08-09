import { checkIfPasswordIsCorrect, createSessionCookieData } from '@utils/securityUtils.ts';
import { getUserData, checkIfUsernameExists, createNewUserData } from '@models/userInfoModels.ts';
import { createSession, deleteSession, getSessionDataFromID } from '@models/sessionModels.ts';
import { tenYearsIn_ms } from '@utils/timeUtils.ts';
import { hashPassword } from '@utils/securityUtils.ts';
import { logger } from '@utils/loggerUtil.ts';
import { RESPONSE_CODES } from '../utils/httpUtils.ts';


export const cookieLoginService = async (sessionID: string) => {

    logger.debug(`Getting session data related to session id: ${sessionID}`);
    const sessionData = await getSessionDataFromID(sessionID)

    if (!sessionData) {
        logger.debug("No session data found...");
        return [RESPONSE_CODES.NOT_FOUND, {}] as const;
    }

    let status = RESPONSE_CODES.OK;
    const sessionExpireTime = (sessionData.rememberSession) ? new Date(0) : sessionData.expiresAt;

    if (sessionData.rememberSession)
        sessionExpireTime.setUTCMilliseconds(Date.now() + tenYearsIn_ms);

    logger.debug("Creating session data...")
    await createSession(sessionID, sessionData.username, sessionData.rememberSession, sessionExpireTime).then(() => status = RESPONSE_CODES.CREATED)
    logger.debug("Done!")

    return [status, { maxAge: tenYearsIn_ms, httpOnly: true }] as const;

}


export const loginService = async (username: string, password: string, rememberSession: boolean) => {

    logger.debug("Checking if user with username: " + username + " exists..")
    const userCreds = await getUserData(username);
    if (!userCreds) {
        logger.debug("User Info Not Found.")
        return [RESPONSE_CODES.NOT_FOUND, "", {}] as const;
    }

    logger.debug("Checking if submitted password is correct...")
    const isCorrectPassword = await checkIfPasswordIsCorrect(password, userCreds.password);

    if (isCorrectPassword) {

        logger.debug("Correct Password! Creating session...")
        let status = 200;
        const [sessionID, cookieOptions, sessionExpireTime] = createSessionCookieData(rememberSession);

        await createSession(sessionID, username, rememberSession, sessionExpireTime).then(() => status = 201)
        logger.debug("Done!")

        return [status, sessionID, cookieOptions] as const;
    }
    else {
        logger.debug("Incorrect Password")
        return [RESPONSE_CODES.BAD_REQUEST, "", {}] as const;
    }
}


export const signupService = async (username: string, password: string) => {

    logger.debug("Checking if username: " + username + " already exists...")
    const usernameAlreadyExists = await checkIfUsernameExists(username);
    if (usernameAlreadyExists) {
        logger.debug(username + " already exists!")
        return RESPONSE_CODES.BAD_REQUEST
    }

    logger.debug("Hashing password to store securely...")
    const hashedPassword = await hashPassword(password) as string;

    logger.debug("Creating user data in database...")
    let status = RESPONSE_CODES.INTERNAL_SERVER_ERROR;
    await createNewUserData(username, hashedPassword).then(() => status = 201);

    logger.debug("Done!")
    return status;
}


export const logoutService = async (sessionID: string) => {
    logger.debug("Deleting session data from database...")
    await deleteSession(sessionID);
    logger.debug("Done!")
}
