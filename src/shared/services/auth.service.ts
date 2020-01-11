import { Injectable } from "@nestjs/common";
import * as jwt from 'jsonwebtoken';
import { Response } from "express";
import * as cookie from 'cookie';
import * as bcrypt from 'bcrypt';
import { Observable } from "rxjs";
import { ServerErrorFilter, UnauthorizedErrorFilter } from "../filters/error.filter";

@Injectable()
export class AuthService {

    setToken(id: string, res: Response) {
        const token = jwt.sign({id}, process.env.JWT_KEY);
        res.setHeader('Set-Cookie', cookie.serialize('token', token, {
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
            httpOnly: true
        }));
        return token;
    }

    verifyPassword(password: string, hash: string): Observable<boolean> {
        return Observable.create( observer => {
            bcrypt.compare(password, hash)
                .then( valid => {
                    if(valid) {
                        observer.next(true);
                        return observer.complete()
                    } else {
                        return observer.error(new UnauthorizedErrorFilter('Invalid login or password'));
                    }
                })
                .catch( err => observer.error(new ServerErrorFilter()) );
        });
    }

}