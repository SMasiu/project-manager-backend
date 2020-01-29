import { Injectable, CanActivate } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Observable } from "rxjs";
import { NotFoundErrorFilter, UnauthorizedErrorFilter } from "../filters/error.filter";
import { DatabaseService } from "../services/database.service";
import { take } from "rxjs/operators";

@Injectable()
export class ProjectGuard implements CanActivate {

    constructor(private readonly databaseService: DatabaseService) { }

    canActivate(context: ExecutionContextHost): Observable<boolean> {
        return Observable.create( async observer => {

            const [_, {project_id}, {req}] = context.getArgs();

            const { user_id } = req.authUser;

            if(!project_id) {
                return observer.error(new NotFoundErrorFilter('Project not found'));
            }
            
            const rows = await this.databaseService.query(observer, `
                SELECT p.project_id, p.creator_id, p.team_id, t.owner
                FROM projects p
                FULL JOIN teams t USING(team_id)
                WHERE p.project_id = $1
                LIMIT 1;
            `, [project_id]).pipe(take(1)).toPromise();
            
            if(!rows) {
                return observer.complete();
            }

            if(!rows.length) {
                return observer.error(new NotFoundErrorFilter('Project not found'));
            }

            const {creator_id, owner, team_id} = rows[0];

            if(user_id === creator_id || user_id === owner) {

                req.meInProject = {
                    project: rows,
                    members: null
                }
                
                observer.next(true)
                return observer.complete();
            }

            if(!team_id) {
                return observer.error(new UnauthorizedErrorFilter('You are not allowed to modify this project'));
            }

            const members = await this.databaseService.query(observer, `
                SELECT user_id, permission
                FROM team_members
                WHERE user_id = $1 AND team_id = $2
                LIMIT 1
            `, [user_id, team_id]).pipe(take(1)).toPromise();

            if(!members) {
                return observer.complete();
            }

            if(!members.length) {
                return observer.error(new UnauthorizedErrorFilter('You are not allowed to modify this project'));
            }

            req.meInProject = {
                project: rows,
                members
            }

            observer.next(true);
            return observer.complete();

        });
    }

}