import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { validationErrorResponse } from '../utils/response.js';

type ValidationType = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, type: ValidationType = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = type === 'body' ? req.body : type === 'query' ? req.query : req.params;
            const result = schema.parse(data);

            // Replace with parsed data (includes type coercion)
            if (type === 'body') {
                req.body = result;
            } else if (type === 'query') {
                req.query = result;
            } else {
                req.params = result;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                validationErrorResponse(res, errors);
                return;
            }

            throw error;
        }
    };
}

export function validateBody(schema: ZodSchema) {
    return validate(schema, 'body');
}

export function validateQuery(schema: ZodSchema) {
    return validate(schema, 'query');
}

export function validateParams(schema: ZodSchema) {
    return validate(schema, 'params');
}
