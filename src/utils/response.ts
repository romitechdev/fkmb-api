import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types/index.js';

export function successResponse<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: PaginationMeta
): Response {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
    };

    if (meta) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
}

export function errorResponse(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = 500,
    errors?: Array<{ field: string; message: string }>
): Response {
    const response: ApiResponse = {
        success: false,
        message,
    };

    if (errors && errors.length > 0) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
}

export function createdResponse<T>(
    res: Response,
    data: T,
    message: string = 'Created successfully'
): Response {
    return successResponse(res, data, message, 201);
}

export function notFoundResponse(
    res: Response,
    message: string = 'Resource not found'
): Response {
    return errorResponse(res, message, 404);
}

export function badRequestResponse(
    res: Response,
    message: string = 'Bad request',
    errors?: Array<{ field: string; message: string }>
): Response {
    return errorResponse(res, message, 400, errors);
}

export function unauthorizedResponse(
    res: Response,
    message: string = 'Unauthorized'
): Response {
    return errorResponse(res, message, 401);
}

export function forbiddenResponse(
    res: Response,
    message: string = 'Forbidden'
): Response {
    return errorResponse(res, message, 403);
}

export function validationErrorResponse(
    res: Response,
    errors: Array<{ field: string; message: string }>
): Response {
    return errorResponse(res, 'Validation failed', 422, errors);
}
