import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/shared/services/database.service";
import { Observable, Observer } from "rxjs";
import { User } from "src/user/user.model";
import { take } from "rxjs/operators";
import { sameId } from "src/shared/functions/same-id";
import { BadRequestFilter, NotFoundErrorFilter } from "src/shared/filters/error.filter";

@Injectable()
export class TaskUsersService {
 
    constructor(private readonly databaseService: DatabaseService) { }

    addUserToTask({task_id, user_id}, { req }): Observable<User> {
        return Observable.create( async observer => {

            const { team_id } = req.meInProject.project;
            const me_id = req.authUser.user_id;
            let valid = false;

            if(sameId(me_id, user_id)) {

                valid = true;

            } else {

                const member = await this.databaseService.query(observer, `
                    SELECT team_id
                    FROM team_members
                    WHERE team_id = $1 AND user_id = $2 AND permission <> 0
                    LIMIT 1;
                `, [team_id, user_id]).pipe(take(1)).toPromise();
                
                if(!member) {
                    return observer.complete();
                }
                
                if(member.length) {
                    valid = true;
                }

            }
            
            if(!valid) {
                return observer.error(new BadRequestFilter('This user is not a part of a project'));
            }

            const isInTask = await this.databaseService.query(observer, `
                SELECT task_id, user_id
                FROM task_users
                WHERE task_id = $1 AND user_id = $2
                LIMIT 1;
            `, [task_id, user_id]).pipe(take(1)).toPromise();

            if(!isInTask) {
                return observer.complete();
            }

            if(isInTask.length) {
                return observer.error(new BadRequestFilter('This user is alredy assigned to this task'));
            }

            const user = await this.databaseService.query(observer, `
                WITH task_u AS (
                    INSERT INTO task_users
                        (task_id, user_id)
                    VALUES ($1, $2)
                    RETURNING user_id
                )
                SELECT u.name, u.surname, u.nick, u.user_id
                FROM task_u t
                JOIN users u USING(user_id)
                LIMIT 1;
            `, [task_id, user_id]).pipe(take(1)).toPromise();

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

    deleteUserFromTask({task_id, user_id}): Observable<User> {
        return Observable.create( async observer => {

           const user = await this.databaseService.query(observer, `
                WITH deleted AS (
                    DELETE FROM task_users
                    WHERE task_id = $1 AND user_id = $2
                    RETURNING user_id
                )
                SELECT u.name, u.surname, u.nick, u.user_id
                FROM deleted d
                JOIN users u USING(user_id)
                LIMIT 1;
           `, [task_id, user_id]).pipe(take(1)).toPromise();

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

    deleteAllByTaskId(obs: Observer<any>, task_id: string): Observable<Boolean> {
        return Observable.create( async observer => {

            const tasks = await this.databaseService.query(obs, `
                DELETE FROM task_users
                WHERE task_id = $1;
            `, [task_id]).pipe(take(1)).toPromise();

            if(!tasks) {
                observer.next(false);
                return observer.complete();
            }

            observer.next(true);
            return observer.complete();

        });
    }
    
    getTaskUsers(task_id: string): Observable<User[]> {
        return Observable.create( async observer => {

            const users = await this.databaseService.query(observer, `
                SELECT u.user_id, u.name, u.surname, u.nick
                FROM task_users t
                JOIN users u USING(user_id)
                WHERE task_id = $1;
            `, [task_id]).pipe(take(1)).toPromise();

            if(!users) {
                return observer.complete();
            }

            observer.next(users);
            return observer.complete();

        });
    }

}