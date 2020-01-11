import { Injectable } from "@nestjs/common";
import { DatabaseServide } from "src/shared/services/database.service";
import { NewUserType, MeType } from "./user.type";
import NewUser from "./new-user";
import { BadRequestFilter, NotFoundErrorFilter } from "src/shared/filters/error.filter";
import { take } from "rxjs/operators";
import { Observable } from "rxjs";
import { AuthService } from "src/shared/services/auth.service";
import { CookieService } from "src/shared/services/cookie.service";

@Injectable()
export class UserService {

    constructor(private readonly databaseService: DatabaseServide,
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
                        const {user_id, hash, name, surname, email, nick} = rows[0];
                        this.authService.verifyPassword(password, hash).pipe(take(1)).subscribe(
                            () => {
                                this.authService.setToken(user_id, res);
                                observer.next({
                                    id: user_id,
                                    name,
                                    surname,
                                    email,
                                    nick
                                });
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

    getUser() {

    }

    getUsers() {

    }

}