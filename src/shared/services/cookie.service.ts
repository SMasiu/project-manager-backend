import { Injectable } from "@nestjs/common";
import * as cookie from 'cookie';

@Injectable()
export class CookieService {

    age: number = 60 * 60 * 24 * 7;

    setCookie(res, name: string, value: string) {
        res.setHeader('Set-Cookie', cookie.serialize(name, value, {
            maxAge: this.age,
            path: '/',
            httpOnly: true,
        }));
    }

    clearCookie(res, name: string) {
        res.setHeader('Set-Cookie', cookie.serialize(name, '', {
            path: '/',
            httpOnly: true,
            expires: new Date(Date.now() - 1000)
        }));
    }

}