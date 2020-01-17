import { Injectable } from "@nestjs/common";
import { AddMemberType, MemberType, TeamType, NewTeamType } from "./team.type";
import { AuthService } from "src/shared/services/auth.service";
import { Observable } from "rxjs";
import { take, map } from "rxjs/operators";
import { DatabaseService } from "src/shared/services/database.service";
import * as Joi from '@hapi/joi';
import { BadRequestFilter, NotFoundErrorFilter, UnauthorizedErrorFilter } from "src/shared/filters/error.filter";
import { sameId } from "src/shared/functions/same-id";

@Injectable()
export class TeamService {

    teamValidateSchema = Joi.object({
        name: Joi.string().min(3).max(30).required()
    });

    constructor(private readonly authService: AuthService, private databaseService: DatabaseService) { }

    createTeam(team: NewTeamType, {req}): Observable<TeamType> {
        return Observable.create( observer => {

            this.authService.varifyToken(req).pipe(take(1)).subscribe(
                ({id}) => {
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
                        `, [team.name, id])
                        .pipe(
                            take(1),
                            map( r => this.mapTeams(r)[0] )
                            ).subscribe(
                            team => {
                                observer.next(team);
                                return observer.complete();
                            },
                            err => observer.error(err)
                        );
                    }
                },
                err => observer.error(err)
            );
        });
    }

    addMember({teamId, userId}: AddMemberType, { req }): Observable<MemberType> {
        return Observable.create( observer => {
            
            this.authService.varifyToken(req).pipe(take(1)).subscribe(
                ({id}) => {

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
                                                )
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
                    (user_id, team_id, permission, accepted)
                    VALUES ($1, $2, 0, false)
                    RETURNING user_id
                )
                SELECT user_id, nick, name, surname, 0 as permission, false as accepted
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

            this.authService.varifyToken(req).pipe(take(1)).subscribe(
                ({id}) => {

                    this.databaseService.query(`
                        SELECT t.team_id, t.name, u.user_id as owner_id, u.name as owner_name, u.nick as owner_nick, u.surname as owner_surname,
                        (SELECT (COUNT(team_id) + 1) as count FROM team_members WHERE team_id = t.team_id) as members_count
                        FROM team_members tm
                        JOIN teams t USING(team_id)
                        JOIN users u ON t.owner = u.user_id
                        WHERE tm.user_id = $1
                        UNION
                        SELECT t.team_id, t.name, u.user_id as owner_id, u.name as owner_name, u.nick as owner_nick, u.surname as owner_surname,
                            (SELECT (COUNT(team_id) + 1) as count FROM team_members WHERE team_id = t.team_id) as members_count
                        FROM teams t
                        JOIN users u ON t.owner = u.user_id
                        WHERE owner = $1
                    `, [id]).pipe(
                        take(1),
                        map( this.mapTeams )
                        ).subscribe(
                        rows => {
                            observer.next(rows);
                            return observer.complete();
                        },
                        err => observer.error(err)
                    );

                },
                err => observer.error(err)
            );
        });
    }

    getTeam(id: string, { req }): Observable<any> {
        return Observable.create( observer => {

            this.authService.varifyToken(req).pipe(take(1)).subscribe(
                () => {
                    this.databaseService.query(`
                        SELECT tm.permission, tm.accepted, u.user_id, u.name, u.surname, u.nick
                        FROM team_members tm
                        JOIN users u USING(user_id)
                        WHERE tm.team_id = $1
                        UNION
                        (SELECT 2 as permission, true as accepted, u.user_id, u.name, u.surname, u.nick
                        FROM teams t
                        JOIN users u ON t.owner = u.user_id
                        WHERE team_id = $1
                        LIMIT 1)
                    `, [id]).pipe(
                            take(1),
                            map( this.mapMembers )
                        ).subscribe(
                        rows => {
                            observer.next(rows);
                            return observer.complete();
                        },
                        err => observer.error(err)
                    );
                },
                err => observer.error(err)
            );

        });
    }

    mapTeams(rows: any[]) {
        return rows.map( r => ({
            team_id: r.team_id,
            name: r.name,
            owner: {
                user_id: r.owner_id,
                name: r.owner_name,
                surname: r.owner_surname,
                nick: r.owner_nick
            },
            membersCount: r.members_count
        }));
    }

    mapMembers(rows: any[]) {
        return rows.map( ({accepted, permission, name, surname, nick, user_id}) => ({
            accepted,
            permission,
            user: {
                name,
                surname,
                nick,
                user_id
            }
        }));
    }
}