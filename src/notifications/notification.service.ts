import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { DatabaseService } from "src/shared/services/database.service";
import { take, map } from "rxjs/operators";
import { mapTeams } from "src/teams/team-maps";

@Injectable()
export class NotificationService {

    constructor(private readonly databaseService: DatabaseService) { }

    getNotifications({ req }): Observable<any> {
        return Observable.create( async observer => {

            const { user_id } = req.authUser;

            const teamInvitations = await this.databaseService.query(observer, `
                SELECT t.team_id, t.name, u.user_id as owner_id, u.name as owner_name, u.nick as owner_nick, u.surname as owner_surname,
                (SELECT (COUNT(team_id) + 1) as count FROM team_members WHERE team_id = t.team_id) as members_count
                FROM team_members tm
                JOIN teams t USING(team_id)
                JOIN users u ON t.owner = u.user_id
                WHERE tm.user_id = $1 AND tm.permission = 0
            `, [user_id]).pipe(
                take(1),
                map( mapTeams )
            ).toPromise();
    
            if(!teamInvitations) {
                return observer.complete();
            }

            observer.next({
                teamInvitations
            });
            return observer.complete();                

        });
    }

}