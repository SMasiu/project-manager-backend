import { Injectable } from "@nestjs/common";
import * as jwt from 'jsonwebtoken';
import { Response } from "express";
import * as cookie from 'cookie';

@Injectable()
export class AuthService {

    setToken(id: string, res: Response) {
        const token = jwt.sign({id}, process.env.JWT_KEY);
        res.setHeader('Set-Cookie', cookie.serialize('token', token, {
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        }));
        return token;
    }

}