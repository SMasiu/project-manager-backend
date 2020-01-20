import { Injectable } from "@nestjs/common";
import * as jwt from 'jsonwebtoken';
import { Response } from "express";
import * as bcrypt from 'bcrypt';
import { Observable } from "rxjs";
import { ServerErrorFilter, UnauthorizedErrorFilter } from "../filters/error.filter";
import { CookieService } from "./cookie.service";

@Injectable()
export class AuthService {

    constructor(private readonly cookieService: CookieService) { }

    setToken(id: string, res: Response) {
        const token = jwt.sign({id}, process.env.JWT_KEY);
        this.cookieService.setCookie(res, 'token', token);
        return token;
    }

    varifyToken(req: Request, { skipErrors }: { skipErrors?: boolean } = {}): Observable<{id: number, valid?: boolean}> {
        
        return Observable.create( observer => {

            const cookies = this.cookieService.getCookies(req);

            if(cookies && cookies.token) {
                jwt.verify(cookies.token, process.env.JWT_KEY, (err, decoded) => {
                    
                    if(err) {
                        if(skipErrors) {
                            observer.next({valid: false, id: -1});
                            return observer.complete();
                        } else {
                            return observer.error(new UnauthorizedErrorFilter());        
                        }
                    } else {
                        if(!(<any>decoded).id) {
                            if(skipErrors) {
                                observer.next({valid:false, id: -1});
                                return observer.complete();
                            } else {
                                return observer.error(new UnauthorizedErrorFilter());
                            }
                        }
                        (<{id: any}>decoded).id = parseInt((<any>decoded).id);
                        observer.next(decoded);
                        return observer.complete();
                    }
                });

            } else {
                if(skipErrors) {
                    observer.next({valid:false, id: -1});
                    return observer.complete();
                } else {
                    return observer.error(new UnauthorizedErrorFilter());
                }
            }
        });

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