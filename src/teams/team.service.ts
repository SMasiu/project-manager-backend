import { Injectable } from "@nestjs/common";
import { AddMemberType, MemberType, TeamType, NewTeamType } from "./team.type";
import { AuthService } from "src/shared/services/auth.service";
import { Observable } from "rxjs";
import { take, map } from "rxjs/operators";
import { DatabaseService } from "src/shared/services/database.service";
import * as Joi from '@hapi/joi';
import { BadRequestFilter, NotFoundErrorFilter, UnauthorizedErrorFilter } from "src/shared/filters/error.filter";
import { sameId } from "src/shared/functions/same-id";
import { mapTeams } from "./team-maps";

@Injectable()
export class TeamService {

    teamValidateSchema = Joi.object({
        name: Joi.string().min(3).max(30).required()
    });

    constructor(private readonly authService: AuthService, private databaseService: DatabaseService) { }

    createTeam(team: NewTeamType, {req}): Observable<TeamType> {
        return Observable.create( observer => {

            const { user_id } = req.authUser;
            
            const { error } = this.teamValidateSchema.validate(team);
            if(error) {
                return observer.error(new BadRequestFilter(error.message));
            } else {
                this.databaseService.query(`
                    WITH t_ins AS (
                        INSERT INTO teams (name, owner)
                        VALUES ($1, $2)
                        RETURNING owner, name, team_id
                    )
                    SELECT t.name, t.team_id, u.user_id as owner_id, u.name as owner_name, u.surname as owner_surname, u.nick as owner_nick
                    FROM t_ins t
                    JOIN users u ON t.owner = u.user_id
                    LIMIT 1;
                `, [team.name, user_id])
                .pipe(
                    take(1),
                    map( r => mapTeams(r)[0] )
                    ).subscribe(
                    team => {
                        observer.next({...team, membersCount: 1});
                        return observer.complete();
                    },
                    err => observer.error(err)
                );
            }
                
        });
    }

    addMember({teamId, userId}: AddMemberType, { req }): Observable<MemberType> {
        return Observable.create( observer => {
            
            const { user_id: id } = req.authUser;

            this.databaseService.query(`
                SELECT t.team_id, t.owner, tm.user_id, tm.permission
                FROM team_members tm
                JOIN teams t USING(team_id)
                WHERE t.team_id = $1
            `, [teamId]).pipe(take(1)).subscribe(
                rows => {
                    if(rows.length) {
                        
                        const moderator = rows.find( r => sameId(r.user_id, id));
                        const user = rows.find( r => sameId(r.user_id, userId));
                        
                        if((moderator && moderator.permission === 1) || sameId(rows[0].owner, id)) {
                            if(!user && !sameId(rows[0].owner, userId)) {
                                this.addMemberToDb({teamId, userId}).pipe(take(1)).subscribe(
                                    member => {
                                        observer.next(member);
                                        return observer.complete();
                                    },
                                    err => observer.error(err)
                                );
                            } else {
                                return observer.error(new BadRequestFilter('User is alredy team member'));
                            }
                        } else { 
                            return observer.error(new UnauthorizedErrorFilter());
                        }

                    } else {
                        this.databaseService.query(`
                            SELECT owner FROM teams WHERE team_id = $1 LIMIT 1;
                        `, [teamId]).pipe(take(1)).subscribe(
                            rows => {
                                if(rows.length) {
                                    if(sameId(rows[0].owner, id)) {

                                        if(sameId(id, userId)) {
                                            return observer.error(new BadRequestFilter('User is alredy team member'));
                                        }

                                        this.addMemberToDb({teamId, userId}).pipe(take(1)).subscribe(
                                            memeber => {
                                                observer.next(memeber);
                                                observer.complete();
                                            },
                                            err => observer.error(err)
                                        );
                                    } else {
                                        return observer.error(new UnauthorizedErrorFilter());
                                    }
                                } else {
                                    return observer.error(new NotFoundErrorFilter('Team not found'));
                                }
                            },
                            err => observer.error(err)
                        );
                    }
                },
                err => observer.error(err)
            );
        });
    }

    private addMemberToDb({teamId, userId}: AddMemberType): Observable<MemberType> {
        return Observable.create( observer => {
            this.databaseService.query(`
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
                ).subscribe(
                ins => {
                    observer.next(ins);
                    return observer.complete();
                },
                err => observer.error(err)
            );

        });
    }

    getTeams({ req }): Observable<TeamType[]> {
        return Observable.create( observer => {

            const { user_id } = req.authUser;

            this.databaseService.query(`
                SELECT t.team_id, t.name, u.user_id as owner_id, u.name as owner_name, u.nick as owner_nick, u.surname as owner_surname,
                (SELECT (COUNT(team_id) + 1) as count FROM team_members WHERE team_id = t.team_id) as members_count
                FROM team_members tm
                JOIN teams t USING(team_id)
                JOIN users u ON t.owner = u.user_id
                WHERE tm.user_id = $1 AND tm.permission <> 0
                UNION
                SELECT t.team_id, t.name, u.user_id as owner_id, u.name as owner_name, u.nick as owner_nick, u.surname as owner_surname,
                    (SELECT (COUNT(team_id) + 1) as count FROM team_members WHERE team_id = t.team_id) as members_count
                FROM teams t
                JOIN users u ON t.owner = u.user_id
                WHERE owner = $1
            `, [user_id]).pipe(
                take(1),
                map( mapTeams )
                ).subscribe(
                rows => {
                    observer.next(rows);
                    return observer.complete();
                },
                err => observer.error(err)
            );

        });
    }

    getTeam(id: string, { req }): Observable<MemberType[]> {
        return Observable.create( observer => {
            this.databaseService.query(`
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
            `, [id]).pipe(
                    take(1),
                    map( this.mapMembers )
                ).subscribe(
                members => {

                    const user_id = req.authUser.user_id;
                    let me = members.find( m => m.user.user_id === user_id );
                    if(!me || me.permission === 0) {
                        return observer.error(new UnauthorizedErrorFilter('Unauthorized user'));
                    }

                    observer.next(members);
                    return observer.complete();
                },
                err => observer.error(err)
            );
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
        return Observable.create( observer => {

            const { user_id } = req.authUser;

            this.databaseService.query(`
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
            ).subscribe(
                members => {

                    if(members.length) {
                        observer.next(members[0]);
                        return observer.complete();
                    }

                    return observer.error(new NotFoundErrorFilter('Team invitation not found'));
                },
                err => observer.error(err)
            );

        });
    }

    leaveTeam(team_id: string, { req }): Observable<MemberType> {
        return Observable.create( observer => {
            const { user_id } = req.authUser;

            this.databaseService.query(`
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
            ).subscribe(
                members => {
                    if(members.length) {
                        observer.next(members[0]);
                        return observer.complete();
                    }

                    return observer.error(new NotFoundErrorFilter('Team not found'));
                },
                err => observer.error(err)
            );
        });
    }

    deleteTeam(team_id: string, { req }): Observable<TeamType> {
        return Observable.create( observer => {

            const { user_id } = req.authUser;

            this.databaseService.query(`
                SELECT owner
                FROM teams
                WHERE team_id = $1
                LIMIT 1;
            `, [team_id]).pipe(
                take(1) 
            ).subscribe( 
                teams => {
                    if(!teams.length) {
                        return observer.error(new NotFoundErrorFilter('Team not found'));
                    }

                    if(user_id !== teams[0].owner) {
                        return observer.error(new UnauthorizedErrorFilter('Unauthorized user'));
                    }

                    this.databaseService.query(`
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
                    ).subscribe( 
                        team => {
                            observer.next(team);
                            return observer.complete();
                        },
                        err => observer.error(err)
                    );

                },
                err => observer.error(err)
            );

        });
    }
}
