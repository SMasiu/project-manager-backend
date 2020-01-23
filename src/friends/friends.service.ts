import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { FriendInvitation } from "./friends.model";
import { sameId } from "src/shared/functions/same-id";
import { BadRequestFilter } from "src/shared/filters/error.filter";
import { DatabaseService } from "src/shared/services/database.service";
import { take } from "rxjs/operators";

@Injectable()
export class FriendsService {

    constructor(private readonly databaseService: DatabaseService) { }

    inviteFriend({ user_id }, { req }): Observable<FriendInvitation> {
        return Observable.create(  async observer => {

            const me_id = req.authUser.user_id;
        
            if(sameId(user_id, me_id)) {
                return observer.error(new BadRequestFilter(`You can't invite yourself`));
            }

            const rows = await this.databaseService.query(observer, `
                SELECT from_id
                FROM friends_invitations
                WHERE (from_id = $1 AND to_id = $2) OR (to_id = $1 AND from_id = $2)
                LIMIT 1;
            `, [me_id, user_id]).pipe(take(1)).toPromise();

            if(!rows) {
                return observer.complete();
            }

            if(rows.length) {
                return observer.error(new BadRequestFilter('There is alredy invitation like this'));
            }

            const users = await this.databaseService.query(observer, `
                WITH ins AS (
                    INSERT INTO friends_invitations (from_id, to_id)
                    VALUES ($1, $2)
                    RETURNING from_id, to_id
                )
                SELECT u.name, u.surname, u.nick, u.user_id
                FROM ins i
                JOIN users u ON u.user_id = i.from_id OR u.user_id = to_id
            `, [me_id, user_id]).pipe(take(1)).toPromise();

            if(!users) {
                return observer.complete();
            }

            observer.next({
                from: users.find( u => sameId(u.user_id, me_id) ),
                to: users.find( u => sameId(u.user_id, user_id) )
            });

            return observer.complete();

        });
    }

}