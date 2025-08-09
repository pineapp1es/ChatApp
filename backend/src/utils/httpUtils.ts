import { Response } from 'express';
import { logger } from './loggerUtil.ts';

export const sendResponseWithStatusAndJSON = (res: Response, statusCode: number, jsonData: object) => {
    logger.debug("Sending HTTP response with code: " + statusCode + " and JSON: " + JSON.stringify(jsonData));
    res.status(statusCode);
    res.json(jsonData)
}

export const sendResponseWithStatus = (res: Response, statusCode: number) => {
    logger.debug("Sending HTTP response with code: " + statusCode);
    res.status(statusCode);
    res.send();
}

export const RESPONSE_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};
