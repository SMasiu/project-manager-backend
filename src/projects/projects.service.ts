import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { BadRequestFilter, NotFoundErrorFilter } from "src/shared/filters/error.filter";
import { DatabaseService } from "src/shared/services/database.service";
import { take } from "rxjs/operators";
import { TeamService } from "src/teams/team.service";
import { Project } from "./projects.model";

@Injectable()
export class ProjectsService {

    constructor(private readonly databaseService: DatabaseService) { }

    createProject({name, description, owner_type, team_id}, { req }): Observable<Project> {

        return Observable.create( async observer => {

            if(owner_type !== 'user' && owner_type !== 'team') {
                return observer.error(new BadRequestFilter('Invalid owner_type'));
            }

            if(owner_type === 'team' && !team_id) {
                return observer.error(new BadRequestFilter('team_id is required'));
            }

            const { user_id } = req.authUser;

            const projects = await this.databaseService.query(observer, `
                WITH new_project AS (
                    INSERT INTO projects 
                        (name, description, open, owner_type, creator_id, team_id)
                    VALUES
                        ($1, $2, $3, $4, $5, $6)
                    RETURNING name, description, open, owner_type, creator_id, team_id, project_id
                )
                SELECT p.name, p.description, p.open, p.owner_type, p.project_id, 
                u.name as user_name, u.surname as user_surname, u.nick as user_nick, u.user_id
                FROM new_project p
                JOIN users u ON u.user_id = p.creator_id
            `, [name, description, true, owner_type, user_id, team_id]).pipe(take(1)).toPromise();
            
            if(!projects) {
                return observer.complete();
            }

            if(!projects.length) {
                return observer.error(new NotFoundErrorFilter('project not found'))
            }

            observer.next({...this.mapProject(projects[0]), team: team_id});
            return observer.complete();

        });

    }

    mapProject({name, description, open, owner_type, project_id, user_name, user_surname, user_nick, user_id}) {
        return {
            project_id,
            name,
            description,
            open,
            owner_type,
            creator: {
                user_id,
                name: user_name,
                surname: user_surname,
                nick: user_nick
            },
            team: null
        }
    }

}