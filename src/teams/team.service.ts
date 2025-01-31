import { Injectable } from "@nestjs/common";
import { AddMemberType, MemberType, TeamType, NewTeamType } from "./team.type";
import { Observable, Observer } from "rxjs";
import { take, map } from "rxjs/operators";
import { DatabaseService } from "src/shared/services/database.service";
import * as Joi from '@hapi/joi';
import { BadRequestFilter, NotFoundErrorFilter, UnauthorizedErrorFilter } from "src/shared/filters/error.filter";
import { sameId } from "src/shared/functions/same-id";
import { mapTeams } from "./team-maps";
import { Team } from "./team.model";

@Injectable()
export class TeamService {

    teamValidateSchema = Joi.object({
        name: Joi.string().min(3).max(30).required()
    });

    constructor(private databaseService: DatabaseService) { }

    getTeamById(team_id: string): Observable<Team> {
        return Observable.create( async observer => {

            const teams = await this.databaseService.query(observer, `
                SELECT t.team_id, t.name, u.user_id as owner_id, u.name as owner_name, u.nick as owner_nick, u.surname as owner_surname,
                    (SELECT (COUNT(team_id) + 1) as count FROM team_members WHERE team_id = $1 AND permission <> 0) as members_count
                FROM teams t
                JOIN users u ON u.user_id = t.owner
                WHERE t.team_id = $1
                LIMIT 1;
            `, [team_id]).pipe(take(1), map(mapTeams)).toPromise();

            if(!teams) {
                return observer.complete();
            }

            if(!teams.length) {
                return observer.error(new NotFoundErrorFilter('Team not found'))
            }

            observer.next(teams[0]);
            return observer.complete();

        });
    }

    createTeam(team: NewTeamType, {req}): Observable<TeamType> {
        return Observable.create( async observer => {

            const { user_id } = req.authUser;
            
            const { error } = this.teamValidateSchema.validate(team);
            if(error) {
                return observer.error(new BadRequestFilter(error.message));
            } else {
                const teamRes = await this.databaseService.query(observer, `
                    WITH t_ins AS (
                        INSERT INTO teams (name, owner)
                        VALUES ($1, $2)
                        RETURNING owner, name, team_id
                    )
                    SELECT t.name, t.team_id, u.user_id as owner_id, u.name as owner_name, u.surname as owner_surname, u.nick as owner_nick
                    FROM t_ins t
                    JOIN users u ON t.owner = u.user_id
                    LIMIT 1;
                `, [team.name, user_id]).pipe(
                    take(1),
                    map( r => mapTeams(r)[0] )
                ).toPromise();

                if(!teamRes) {
                    return observer.complete();
                }

                observer.next({...teamRes, membersCount: 1});
                return observer.complete();    
            }
        });
    }

    addMember({teamId, userId}: AddMemberType, { req }): Observable<MemberType> {
        return Observable.create( async observer => {
            
            const { user_id: id } = req.authUser;

            const rows = await this.databaseService.query(observer, `
                SELECT t.team_id, t.owner, tm.user_id, tm.permission
                FROM team_members tm
                JOIN teams t USING(team_id)
                WHERE t.team_id = $1
            `, [teamId]).pipe(take(1)).toPromise()
                
            if(!rows) {
                return observer.complete();
            }

            if(rows.length) {
                
                const moderator = rows.find( r => sameId(r.user_id, id));
                const user = rows.find( r => sameId(r.user_id, userId));

                if((moderator && moderator.permission === 2) || sameId(rows[0].owner, id)) {

                    if(user || sameId(rows[0].owner, userId)) {
                        return observer.error(new BadRequestFilter('User is alredy team member'));
                    }
                    const member = await this.addMemberToDb({teamId, userId}).pipe(take(1)).toPromise();
                        
                    observer.next(member);
                    return observer.complete();

                } else { 
                    return observer.error(new UnauthorizedErrorFilter());
                }

            } else {
                const rows = await this.databaseService.query(observer, `
                    SELECT owner FROM teams WHERE team_id = $1 LIMIT 1;
                `, [teamId]).pipe(take(1)).toPromise();

                if(!rows) {
                    return observer.complete();
                }

                if(!rows.length) {
                    return observer.error(new NotFoundErrorFilter('Team not found'));
                }

                if(!sameId(rows[0].owner, id)) {
                    return observer.error(new UnauthorizedErrorFilter());
                }

                if(sameId(id, userId)) {
                    return observer.error(new BadRequestFilter('User is alredy team member'));
                }

                const member = await this.addMemberToDb({teamId, userId}).pipe(take(1)).toPromise();
                    
                observer.next(member);
                observer.complete();

            }
        });
    }

    private addMemberToDb({teamId, userId}: AddMemberType): Observable<MemberType> {
        return Observable.create( async observer => {
            const ins = await this.databaseService.query(observer, `
                WITH u_id as (
                    INSERT INTO team_members
                    (user_id, team_id, permission)
                    VALUES ($1, $2, 0)
                    RETURNING user_id
                )
                SELECT user_id, nick, name, surname, 0 as permission
                FROM users
                WHERE user_id = (SELECT user_id from u_id LIMIT 1)
                LIMIT 1;
            `, [userId, teamId]).pipe(
                take(1),
                map( r =>this.mapMembers(r)[0] )
            ).toPromise();
                
            if(!ins) {
                return observer.complete();
            }

            observer.next(ins);
            return observer.complete();
            
        });
    }

    getTeams({ req }): Observable<TeamType[]> {
        return Observable.create( async observer => {

            const { user_id } = req.authUser;

            const rows = await this.databaseService.query(observer, `
                SELECT t.team_id, t.name, u.user_id as owner_id, u.name as owner_name, u.nick as owner_nick, u.surname as owner_surname,
                (SELECT (COUNT(team_id) + 1) as count FROM team_members WHERE team_id = t.team_id AND permission <> 0) as members_count
                FROM team_members tm
                JOIN teams t USING(team_id)
                JOIN users u ON t.owner = u.user_id
                WHERE tm.user_id = $1 AND tm.permission <> 0
                UNION
                SELECT t.team_id, t.name, u.user_id as owner_id, u.name as owner_name, u.nick as owner_nick, u.surname as owner_surname,
                    (SELECT (COUNT(team_id) + 1) as count FROM team_members WHERE team_id = t.team_id AND permission <> 0) as members_count
                FROM teams t
                JOIN users u ON t.owner = u.user_id
                WHERE owner = $1
            `, [user_id]).pipe(
                take(1),
                map( mapTeams )
            ).toPromise();
                
            if(!rows) {
                return observer.complete();
            }

            observer.next(rows);
            return observer.complete();

        });
    }

    getTeam(id: string, { req }): Observable<MemberType[]> {
        return Observable.create( async observer => {
            const members = await this.databaseService.query(observer, `
                SELECT tm.permission, u.user_id, u.name, u.surname, u.nick
                FROM team_members tm
                JOIN users u USING(user_id)
                WHERE tm.team_id = $1
                UNION
                (SELECT 3 as permission, u.user_id, u.name, u.surname, u.nick
                FROM teams t
                JOIN users u ON t.owner = u.user_id
                WHERE team_id = $1
                LIMIT 1)
                ORDER BY permission DESC;
            `, [id]).pipe(take(1),map( this.mapMembers )).toPromise();
                
            if(!members) {
                return observer.complete();
            }

            const user_id = req.authUser.user_id;
            let me = members.find( m => sameId(m.user.user_id, user_id) );
            if(!me || me.permission === 0) {
                return observer.error(new UnauthorizedErrorFilter('Unauthorized user'));
            }

            observer.next(members);
            return observer.complete();
                
        });
    }

    mapMembers(rows: any[]) {
        return rows.map( ({permission, name, surname, nick, user_id}) => ({
            permission,
            user: {
                name,
                surname,
                nick,
                user_id
            }
        }));
    }

    acceptTeamInvitation(team_id: string, { req }): Observable<MemberType> {
        return Observable.create( async observer => {

            const { user_id } = req.authUser;

            const members = await this.databaseService.query(observer, `
                WITH updated AS (
                    UPDATE team_members
                    SET permission = 1
                    WHERE team_id = $1 AND user_id = $2 AND permission = 0
                    RETURNING user_id, permission
                )
                SELECT up.permission, u.name, u.nick, u.surname, u.user_id
                FROM updated up
                JOIN users u USING(user_id)
                LIMIT 1;
            `, [team_id, user_id]).pipe(
                take(1),
                map( this.mapMembers )
            ).toPromise();
                
            if(!members) {
                return observer.complete();
            }

            if(members.length) {
                observer.next(members[0]);
                return observer.complete();
            }

            return observer.error(new NotFoundErrorFilter('Team invitation not found'));

        });
    }

    leaveTeam(team_id: string, { req }): Observable<MemberType> {
        return Observable.create( async observer => {
            const { user_id } = req.authUser;

            const members = await this.databaseService.query(observer, `
                WITH deleted AS (
                    DELETE
                    FROM team_members
                    WHERE team_id = $1 AND user_id = $2
                    RETURNING permission, user_id
                )
                SELECT d.permission, u.name, u.surname, u.nick, u.user_id
                FROM deleted d
                JOIN users u USING(user_id)
                LIMIT 1;
            `, [team_id, user_id]).pipe(
                take(1),
                map( this.mapMembers )
            ).toPromise();

            if(!members) {
                return observer.complete();
            }

            if(members.length) {
                observer.next(members[0]);
                return observer.complete();
            }

            return observer.error(new NotFoundErrorFilter('Team not found'));
                
        });
    }

    deleteTeam(team_id: string): Observable<TeamType> {
        return Observable.create( async observer => {

            const res0 = await this.databaseService.query(observer, `
                UPDATE projects
                SET owner_type = 'user', team_id = null
                WHERE team_id = $1;
            `, [team_id]).pipe(take(1)).toPromise();

            if(!res0) {
                return observer.complete();
            }
            
            const deletedMembers = await this.databaseService.query(observer, `
                DELETE FROM team_members WHERE team_id = $1;
            `, [team_id]).pipe(take(1)).toPromise();

            if(!deletedMembers) {
                return observer.complete();
            }

            const team = await this.databaseService.query(observer, `
                WITH deleted as (
                    DELETE
                    FROM teams
                    WHERE team_id = $1
                    RETURNING team_id, owner, name
                )
                SELECT d.team_id, d.name, u.user_id as owner_id, u.name as owner_name, u.nick as owner_nick, u.surname as owner_surname, 0 as members_count
                FROM deleted d
                JOIN users u ON u.user_id = owner
                LIMIT 1;
            `, [team_id]).pipe(
                take(1),
                map( r => mapTeams(r)[0] )
            ).toPromise();

            if(!team) {
                return observer.complete();
            }
            
            observer.next(team);
            return observer.complete();

        });
    }

    kickOutOfTheTeam({ team_id, user_id }, { req }) {

        return Observable.create( async observer => {
            const me_id = req.authUser.user_id;

            if(sameId(me_id, user_id)) {
                return observer.error(new BadRequestFilter(`You can't kick yourself gtom team`));
            }
                
            const members = await this.databaseService.query(observer, `
                WITH deleted AS(
                    DELETE
                    FROM team_members
                    WHERE team_id = $1 AND user_id = $2
                    RETURNING permission, user_id
                )
                SELECT d.permission, u.name, u.surname, u.nick, u.user_id
                FROM deleted d
                JOIN users u USING(user_id)
                LIMIT 1
            `, [team_id, user_id]).pipe(take(1), map( this.mapMembers )).toPromise();

            if(!members) {
                return observer.complete();
            }

            if(!members.length) {
                return observer.error(new NotFoundErrorFilter('User not found'))
            }

            observer.next(members[0]);
            return observer.complete();
        
        });
    }

    changeMemberPermission({user_id, team_id, permission}, {req}): Observable<MemberType> {
        return Observable.create( async observer => {
            const me_id = req.authUser.user_id;

            if(sameId(me_id, user_id)) {
                return observer.error(new BadRequestFilter(`You can't change yours permission`));
            }

            if(permission !== 2 && permission !== 1) {
                return observer.error(new BadRequestFilter('Invalid permision'));
            }

            const members = await this.databaseService.query(observer, `
                WITH updated AS(
                    UPDATE team_members
                    SET permission = $3
                    WHERE team_id = $1 AND user_id = $2 AND permission <> 0
                    RETURNING permission, user_id
                )
                SELECT up.permission, u.name, u.surname, u.nick, u.user_id
                FROM updated up
                JOIN users u USING(user_id)
                LIMIT 1
            `, [team_id, user_id, permission]).pipe(take(1), map(this.mapMembers)).toPromise();

            if(!members) {
                return observer.complete();
            }

            if(!members.length) {
                return observer.error(new NotFoundErrorFilter('User not found'));
            }

            observer.next(members[0]);
            return observer.complete();

        });
    }

    changeOwner({ team_id, user_id }, { req }) {
        return Observable.create( async observer => {

            const me_id = req.authUser.user_id;

            if(sameId(me_id, user_id)) {
                return observer.error(new BadRequestFilter('You are alredy owner'));
            }

            const members = await this.databaseService.query(observer, `
                SELECT user_id, permission
                FROM team_members
                WHERE user_id = $1 AND team_id = $2
                LIMIT 1;
            `, [user_id, team_id]).pipe(take(1)).toPromise();

            if(!members) {
                return observer.complete();
            }

            if(!members.length) {
                return observer.error(new NotFoundErrorFilter('User not found'));
            }   
            let [member] = members;

            if(member.permission === 0) {
                return observer.error(new BadRequestFilter(`This user isn't a team member`));
            }

            const res1 = await this.databaseService.query(observer, `
                INSERT INTO team_members (team_id, user_id, permission) VALUES ($1, $2, 2)
            `, [team_id, me_id]).pipe(take(1)).toPromise();

            if(!res1) {
                return observer.complete();
            }

            const res2 = await this.databaseService.query(observer, `
                DELETE FROM team_members WHERE user_id = $2 AND team_id = $1
            `, [team_id, user_id]).pipe(take(1)).toPromise();

            if(!res2) {
                return observer.complete();
            }

            const team = await this.databaseService.query(observer, `
                WITH updated as (
                    UPDATE teams
                    SET owner = $2
                    WHERE team_id = $1
                    RETURNING owner, team_id, name
                )
                SELECT u.name as owner_name, u.surname as owner_surname, u.nick as owner_nick, u.user_id as owner_id, up.name, up.team_id,
                    (SELECT (COUNT(team_id) + 1) as count FROM team_members WHERE team_id = $1 AND permission <> 0) as members_count
                FROM updated up
                JOIN users u ON u.user_id = up.owner
                LIMIT 1;
            `, [team_id, user_id]).pipe(take(1), map(mapTeams)).toPromise();

            if(!team) {
                return observer.complete();
            }

            if(!team.length) {
                return observer.error(new NotFoundErrorFilter('Team not found'));
            }

            observer.next(team[0]);
            return observer.complete();

        });
    }

}
