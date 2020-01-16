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

                        this.databaseService.queryMany([{
                            sql: `INSERT INTO teams (name, owner) VALUES ($1, $2);`,
                            args: [team.name, id]
                        },{
                            sql: `SELECT currval('teams_team_id_seq');`
                        }]).pipe(take(1)).subscribe(
                            ([_, rows2]) => {
                                observer.next({name: team.name, owner: id, team_id: rows2[0].currval});
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
                INSERT INTO team_members (user_id, team_id, permission) VALUES ($1, $2, 0)
            `, [userId, teamId]).pipe(take(1)).subscribe(
                _ => {
                    observer.next({team_id: teamId, user_id: userId, permission: 0});
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
                        map( rows => rows.map(r => ({
                            team_id: r.team_id,
                            name: r.name,
                            owner: {
                                user_id: r.owner_id,
                                name: r.owner_name,
                                surname: r.owner_surname,
                                nick: r.owner_nick
                            },
                            membersCount: r.members_count
                        })))
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
                        SELECT tm.team_id, tm.permission, tm.user_id
                        FROM team_members tm
                        JOIN teams t USING(team_id)
                        WHERE t.team_id = $1
                    `, [id]).pipe(take(1)).subscribe(
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

}