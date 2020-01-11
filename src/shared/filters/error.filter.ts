import { HttpException, HttpStatus } from "@nestjs/common";
import { defineError } from "src/graphql/error";

export class BadRequestFilter extends HttpException {
    constructor(message: string) {
        super(defineError({message, type: 'BadRequest'}), HttpStatus.BAD_REQUEST)
    }
}

export class ServerErrorFilter extends HttpException {
    constructor() {
        super(defineError({type: 'ServerError'}), HttpStatus.INTERNAL_SERVER_ERROR)
    }
}

export class UnauthorizedErrorFilter extends HttpException {
    constructor(message: string = 'Unauthorized user') {
        super(defineError({message, type: 'Unauthorized'}), HttpStatus.UNAUTHORIZED);
    }
}

export class NotFoundErrorFilter extends HttpException {
    constructor(message: string = 'Resource not found') {
        super(defineError({message, type: 'NotFound'}), HttpStatus.NOT_FOUND);
    }
}