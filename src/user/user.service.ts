import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/shared/services/database.service";
import { NewUserType, MeType, UserType } from "./user.type";
import NewUser from "./new-user";
import { BadRequestFilter, NotFoundErrorFilter } from "src/shared/filters/error.filter";
import { take, map } from "rxjs/operators";
import { Observable, observable } from "rxjs";
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
            `, [userName.toLowerCase()]).pipe(take(1)).subscribe(
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

    getUser(id: string): Observable<UserType> {
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

    getFullNameTemplate(fullname: string) {
        let arr = fullname.split(' ')
        if(arr.length === 1) {
            return `%${fullname}%`; 
        } else {
            return `%(${arr[0]}|${arr[1]})%`
        }
    }

    getUsers(options): Observable<UserType[]> {

        const { limit, offset } = mapGetOptions(options);
        const { fullname } = options;

        return Observable.create( observer => {
            this.databaseService.query(`
                WITH full_table AS(
                    SELECT CONCAT(name, ' ',surname, ' ', nick) as fullname, user_id 
                    FROM users
                )
                SELECT u.name, u.surname, u.nick, u.user_id
                FROM full_table ft
                    JOIN users u USING(user_id)
                WHERE ft.fullname SIMILAR TO $3
                LIMIT $1
                OFFSET $2
            `, [limit, offset, this.getFullNameTemplate(fullname)]).pipe(take(1)).subscribe(
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
            this.authService.varifyToken(req, {skipErrors: true}).pipe(take(1)).subscribe( 
                ({id, valid}) =>  {
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
                },
                err => observer.error(err)
            );
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

    getUsersCount({fullname}): Observable<number> {
        return Observable.create( observer => {

            let obs: Observable<any>;

            if(fullname) {
                obs = this.databaseService.query(`
                    WITH full_table AS(
                        SELECT CONCAT(name, ' ',surname, ' ', nick) as fullname
                        FROM users
                    )
                    SELECT COUNT(fullname)
                    FROM full_table
                    WHERE fullname SIMILAR TO $1
                `, [this.getFullNameTemplate(fullname)]);
            } else {
                obs = this.databaseService.query(`
                    SELECT COUNT(user_id) FROM users;
                `);
            }

            obs.pipe(
                take(1),
                map( rows => rows[0].count )
            ).subscribe(
                count => {
                    observer.next(count);
                    return observer.complete();
                },
                err => observer.error(err)
            );
        });
    }

}