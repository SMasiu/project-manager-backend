import { Injectable, CanActivate } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Observable } from "rxjs";
import { DatabaseService } from "../services/database.service";
import { take } from "rxjs/operators";
import { UnauthorizedErrorFilter } from "../filters/error.filter";

@Injectable()
export class TeamGuard implements CanActivate {

    constructor(private readonly databaseService: DatabaseService) { }

    canActivate(context: ExecutionContextHost): Observable<boolean> {

        return Observable.create( async observer => {

            const allArgs = context.getArgs();

            const args = allArgs[1]
            const req = allArgs[2].req;

            const { team_id } = args;
            const { user_id } = req.authUser;

            if(!team_id) {
                observer.next(true);
                observer.complete();
            }

            const members = await this.databaseService.query(observer, `
                SELECT t.team_id, t.owner, t.name, m.user_id, m.permission
                FROM team_members m
                JOIN teams t USING (team_id)
                WHERE team_id = $1 AND (user_id = $2 OR owner = $2)
                LIMIT 1;
            `, [team_id, user_id]).pipe(take(1)).toPromise();

            if(!members) {
                return observer.complete();
            }

            if(!members.length) {
                return observer.error(new UnauthorizedErrorFilter('You are not member of this team'))
            }

            req.meInTeam = members[0];
            observer.next(true);
            return observer.complete();

        });

    }

}

@Injectable()
export class TeamRequiredGuard implements CanActivate {
    canActivate(context: ExecutionContextHost): Observable<boolean> {
        return Observable.create( observer => {

            const req = context.getArgs()[2].req;
            const { meInTeam } = req;

            if(!meInTeam) {
                return observer.error(new UnauthorizedErrorFilter('Unauthorized user permission'));
            }

            observer.next(true);
            return observer.complete();

        });
    }
}