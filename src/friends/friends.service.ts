import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { sameId } from "src/shared/functions/same-id";
import { BadRequestFilter, NotFoundErrorFilter } from "src/shared/filters/error.filter";
import { DatabaseService } from "src/shared/services/database.service";
import { take } from "rxjs/operators";
import { User } from "src/user/user.model";

@Injectable()
export class FriendsService {

    constructor(private readonly databaseService: DatabaseService) { }

    inviteFriend({ user_id }, { req }): Observable<User> {
        return Observable.create(  async observer => {

            const me_id = req.authUser.user_id;
        
            if(sameId(user_id, me_id)) {
                return observer.error(new BadRequestFilter(`You can't invite yourself`));
            }

            const rows = await this.databaseService.query(observer, `
                SELECT from_id
                FROM friends_invitations
                WHERE (from_id = $1 AND to_id = $2) OR (to_id = $1 AND from_id = $2)
                UNION
                SELECT 0 as from_id
                FROM friends
                WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_2 = $1 AND user_id_1 = $2)
                LIMIT 1;
            `, [me_id, user_id]).pipe(take(1)).toPromise();

            if(!rows) {
                return observer.complete();
            }

            if(rows.length) {
                return observer.error(new BadRequestFilter('There is alredy invitation like this or you are alredy friends'));
            }

            const users = await this.databaseService.query(observer, `
                WITH ins AS (
                    INSERT INTO friends_invitations (from_id, to_id)
                    VALUES ($1, $2)
                    RETURNING from_id, to_id
                )
                SELECT u.name, u.surname, u.nick, u.user_id
                FROM ins i
                JOIN users u ON u.user_id = to_id
            `, [me_id, user_id]).pipe(take(1)).toPromise();

            if(!users) {
                return observer.complete();
            }

            if(!users.length) {
                return observer.error(new NotFoundErrorFilter('User not found'));
            }
            
            observer.next(users[0]);

            return observer.complete();

        });
    }

    rejectInvitation({ user_id }, { req }): Observable<User> {
        return Observable.create( async observer => {

            const me_id = req.authUser.user_id;

            if(sameId(me_id, user_id)) {
                return observer.error(new BadRequestFilter(`You can't reject invitation from yourself`));
            }

            const user = await this.databaseService.query(observer, `
                WITH deleted AS (
                    DELETE FROM friends_invitations
                    WHERE to_id = $1 AND from_id = $2
                    RETURNING from_id
                )
                SELECT u.name, u.nick, u.surname, u.user_id
                FROM deleted d
                JOIN users u ON d.from_id = u.user_id;
            `, [me_id, user_id]).pipe(take(1)).toPromise();

            if(!user) {
                return observer.complete();
            }

            if(!user.length) {
                return observer.erorr(new NotFoundErrorFilter('User not found'));
            }

            observer.next(user[0]);
            return observer.complete();
        });
    }

    acceptInvitation({ user_id }, { req }): Observable<User> {
        return Observable.create( async observer => {

            const me_id = req.authUser.user_id;

            if(sameId(user_id, me_id)) {
                return observer.error(new BadRequestFilter(`You can't accept invitation from yourself`));
            }

            const users = await this.databaseService.query(observer, `
                WITH deleted AS (
                    DELETE FROM friends_invitations
                    WHERE to_id = $1 AND from_id = $2
                    RETURNING to_id, from_id
                )
                SELECT u.name, u.surname, u.nick, u.user_id
                FROM deleted d
                JOIN users u ON u.user_id = d.from_id OR u.user_id = d.to_id
            `, [me_id, user_id]).pipe(take(1)).toPromise();

            if(!users) {
                return observer.complete();
            }

            if(users.length !== 2) {
                return observer.error(new NotFoundErrorFilter('Users not found'));
            }

            const friends = await this.databaseService.query(observer, `
                INSERT INTO friends (user_id_1, user_id_2)
                VALUES ($1, $2);
            `, [me_id, user_id]).pipe(take(1)).toPromise();

            if(!friends) {
                return observer.complete();
            }

            observer.next(users.find( u => u.user_id = user_id ))
            observer.complete();

        });
    }

    cancelInvitation({ user_id }, { req }): Observable<User> {
        return Observable.create( async observer => {

            const me_id = req.authUser.user_id;

            if(sameId(user_id, me_id)) {
                return observer.error(new BadRequestFilter(`You can't cancel invitation from yourself`))
            }

            const users = await this.databaseService.query(observer, `
                WITH deleted AS (
                    DELETE
                    FROM friends_invitations
                    WHERE from_id = $1 AND to_id = $2
                    RETURNING to_id
                )
                SELECT u.nick, u.surname, u.name, u.user_id
                FROM deleted d
                JOIN users u ON u.user_id = d.to_id
            `, [me_id, user_id]).pipe(take(1)).toPromise();

            if(!users) {
                return observer.complete();
            }

            if(!users.length) {
                return observer.error(new NotFoundErrorFilter('User not found'));
            }

            observer.next(users[0]);
            return observer.complete();

        });
    }

    getMyFriends({ req }): Observable<User[]> {
        return Observable.create( async observer => {

            const { user_id } = req.authUser;

            const friends = await this.databaseService.query(observer, `
                SELECT u.nick, u.name, u.surname, u.user_id
                FROM friends f
                JOIN users u ON 
                    (u.user_id = f.user_id_1 AND u.user_id <> $1) OR 
                    (u.user_id = f.user_id_2 AND u.user_id <> $1)
                WHERE f.user_id_1 = $1 OR f.user_id_2 = $1;
            `, [user_id]).pipe(take(1)).toPromise();

            if(!friends) {
                return observer.complete();
            }

            observer.next(friends);
            return observer.complete();

        });        
    }

    getInvitedFriends({ req }): Observable<User[]> {
        return Observable.create( async observer => {

            const { user_id } = req.authUser;

            const friends = await this.databaseService.query(observer, `
                SELECT u.name, u.surname, u.nick, u.user_id
                FROM friends_invitations f
                JOIN users u ON u.user_id = f.to_id
                WHERE f.from_id = $1;
            `, [user_id]).pipe(take(1)).toPromise();

            if(!friends) {
                return observer.complete();
            }

            observer.next(friends);
            return observer.complete();

        });
    }

    deleteFriend({ user_id }, { req }): Observable<User> {
        return Observable.create( async observer => {

            const me_id = req.authUser.user_id;

            if(sameId(user_id, me_id)) {
                return observer.error(`You can't unfriend yourself`);
            }

            const user = await this.databaseService.query(observer, `
                WITH deleted AS (
                    DELETE FROM friends
                    WHERE 
                        (user_id_1 = $1 AND user_id_2 = $2) OR 
                        (user_id_1 = $2 AND user_id_2 = $1)
                    RETURNING user_id_1, user_id_2
                )
                SELECT u.nick, u.name, u.surname, u.user_id
                FROM deleted d
                JOIN users u ON 
                    (d.user_id_1 = $1 AND u.user_id = d.user_id_1) OR 
                    (d.user_id_2 = $1 AND u.user_id = d.user_id_2)
            `, [me_id, user_id]).pipe(take(1)).toPromise();

            if(!user) {
                return observer.complete();
            }

            if(!user.length) {
                return observer.error(new NotFoundErrorFilter('User not found'));
            }

            observer.next(user[0]);
            return observer.complete();

        });
    }

} 