import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/shared/services/database.service";
import { NewUserType, MeType, UserType } from "./user.type";
import NewUser from "./new-user";
import { BadRequestFilter, NotFoundErrorFilter } from "src/shared/filters/error.filter";
import { take, map } from "rxjs/operators";
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
                        this.authService.setToken(user.user_id, res);
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
        return Observable.create( async observer => {
            let userLogin = userName.indexOf('@') === -1 ? 'nick' : 'email';

            const rows = await this.databaseService.query(observer, `
                SELECT user_id, password as hash, name, surname, email, nick FROM users WHERE ${userLogin} = $1 LIMIT 1;
            `, [userName.toLowerCase()]).pipe(take(1)).toPromise();
            
            if(!rows) {
                return observer.complete();
            }

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
        return Observable.create( async observer => {
    
            const rows = await this.databaseService.query(observer, `
                SELECT user_id, name, surname, nick FROM users WHERE user_id = $1 LIMIT 1;
            `, [id]).pipe(take(1)).toPromise();
                
            if(!rows) {
                return observer.complete();
            }

            if(rows.length) {
                observer.next(rows[0]);
                return observer.complete();
            } else {
                return observer.error(new NotFoundErrorFilter('User not found'));
            }
                
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

    getUsers(options, { req }): Observable<UserType[]> {

        const { limit, offset } = mapGetOptions(options);
        const { fullname, team_id } = options;
        const me_id = req.authUser.user_id;

        return Observable.create( async observer => {
            const rows = await this.databaseService.query(observer, `
                WITH full_table AS(
                    SELECT CONCAT(u.name, ' ',u.surname, ' ', u.nick) as fullname, u.user_id 
                    FROM users u
                    WHERE u.user_id <> $5 AND NOT EXISTS (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = u.user_id AND tm.team_id = $4 )
                    LIMIT $1
                    OFFSET $2
                )
                SELECT u.name, u.surname, u.nick, u.user_id
                FROM full_table ft
                    JOIN users u USING(user_id)
                WHERE ft.fullname SIMILAR TO $3
            `, [limit, offset, this.getFullNameTemplate(fullname), team_id, me_id]).pipe(take(1)).toPromise();

            if(!rows) {
                return observer.complete();
            }

            observer.next(rows);
            return observer.complete();
              
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
        return Observable.create( async observer => {
            const rows = await this.databaseService.query(observer, `
                SELECT user_id, name, surname, nick, email FROM users WHERE user_id = $1 LIMIT 1;
            `, [id]).pipe(take(1)).toPromise();

            if(!rows) {
                return observer.complete();
            }

            if(rows.length) {
                observer.next(rows[0]);
                return observer.complete();
            }
            return observer.error(new NotFoundErrorFilter('User not found'));
              
        });
    }

    getUsersCount({fullname, team_id}, { req }): Observable<number> {
        return Observable.create( async observer => {

            const me_id = req.authUser.user_id;
            let obs: Observable<any>;

            obs = this.databaseService.query(observer, `
                WITH full_table AS(
                    SELECT CONCAT(u.name, ' ',u.surname, ' ', u.nick) as fullname, u.user_id 
                    FROM users u
                    WHERE u.user_id <> $2 AND NOT EXISTS (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = u.user_id AND tm.team_id = $3 )
                )
                SELECT COUNT(fullname)
                FROM full_table
                WHERE fullname SIMILAR TO $1

            `, [this.getFullNameTemplate(fullname), me_id, team_id]);
        

            const count = await obs.pipe(
                take(1),
                map( rows => (rows && rows[0].count) || 0 )
            ).toPromise();

            observer.next(count);
            return observer.complete();
        });
    }

}