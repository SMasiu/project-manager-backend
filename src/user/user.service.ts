import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/shared/services/database.service";
import { NewUserType, MeType, UserType } from "./user.type";
import NewUser from "./new-user";
import { BadRequestFilter, NotFoundErrorFilter } from "src/shared/filters/error.filter";
import { take } from "rxjs/operators";
import { Observable } from "rxjs";
import { AuthService } from "src/shared/services/auth.service";
import { CookieService } from "src/shared/services/cookie.service";
import { mapGetOptions } from "src/shared/functions/map-get-options";

@Injectable()
export class UserService {

    constructor(private readonly databaseService: DatabaseService,
                private readonly authService: AuthService,
                private readonly cookieService: CookieService) { }

    createUser(user: NewUserType, { res }): Observable<MeType> {
        return Observable.create(observer => {
            const newUser = new NewUser(user, this.databaseService);

            newUser.validate().pipe(take(1)).subscribe(valid => {
                if(valid) {
                    newUser.save().pipe(take(1)).subscribe(
                    user => {
                        this.authService.setToken(user.id, res);
                        observer.next(user);
                        observer.complete();
                    },
                    (err) => observer.error(err));
                } else {
                    observer.error(new BadRequestFilter(newUser.createErrorRaport()));
                }
            });
        });
    }
    
    loginUser({userName, password}: {userName: string, password: string}, { res, req }): Observable<MeType> {
        return Observable.create( observer => {
            let userLogin = userName.indexOf('@') === -1 ? 'nick' : 'email';

            this.databaseService.query(`
                SELECT user_id, password as hash, name, surname, email, nick FROM users WHERE ${userLogin} = $1 LIMIT 1;
            `, [userName]).pipe(take(1)).subscribe(
                rows => {
                    if(rows.length) {
                        const { user_id, hash } = rows[0];
                        this.authService.verifyPassword(password, hash).pipe(take(1)).subscribe(
                            () => {
                                this.authService.setToken(user_id, res);
                                observer.next(rows[0]);
                                return observer.complete();
                            },
                            err => observer.error(err)
                        );
                    } else {
                        return observer.error(new NotFoundErrorFilter('User not found'));
                    }
                },
                err => observer.error(err)
            );
        });
    }

    logoutUser({res}): Observable<string> {
        return Observable.create( observer => {
            this.cookieService.clearCookie(res, 'token');
            observer.next('OK');
            return observer.complete();
        });
    }

    getUser(id: string, { req }): Observable<UserType> {
        return Observable.create( observer => {
    
            this.databaseService.query(`
                SELECT user_id, name, surname, nick FROM users WHERE user_id = $1 LIMIT 1;
            `, [id]).pipe(take(1)).subscribe(
                rows => {
                    if(rows.length) {
                        observer.next(rows[0]);
                        return observer.complete();
                    } else {
                        return observer.error(new NotFoundErrorFilter('User not found'));
                    }
                },
                err => observer.error(err)
            );
                
        });
    }

    getUsers(options, { req }): Observable<UserType[]> {

        const {limit, offset} = mapGetOptions(options);

        return Observable.create( observer => {
            this.databaseService.query(`
                SELECT user_id, name, surname, nick FROM users LIMIT $1 OFFSET $2;
            `, [limit, offset]).pipe(take(1)).subscribe(
                rows => {
                    observer.next(rows);
                    return observer.complete();
                },
                err => observer.error(err)
            );
        });
    }

    checkUserStatus({ req }): Observable<any> {
        return Observable.create( observer => {
            this.authService.varifyToken(req, {skipErrors: true}).pipe(take(1)).subscribe( ({id, valid}) =>  {
                if(valid === false) {
                    observer.next({
                        logged: false,
                        me: null
                    });
                    return observer.complete();
                }

                this.getMeById(id).pipe(take(1)).subscribe(
                    me => {
                        observer.next({
                            logged: true,
                            me
                        });
                        return observer.complete();
                    },
                    err => observer.error(err)
                ); 
            });
        });
    }

    getMeById(id): Observable<MeType> {
        return Observable.create( observer => {
            this.databaseService.query(`
                SELECT user_id, name, surname, nick, email FROM users WHERE user_id = $1 LIMIT 1;
            `, [id]).pipe(take(1)).subscribe(
                rows => {
                    if(rows.length) {
                        observer.next(rows[0]);
                        return observer.complete();
                    }
                    return observer.error(new NotFoundErrorFilter('User not found'));
                },
                err => observer.error(err)
            );
        });
    }

}