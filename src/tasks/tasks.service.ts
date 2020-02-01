import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/shared/services/database.service";
import { Observable } from "rxjs";
import { Task } from "./tasks.model";
import { take } from "rxjs/operators";
import { NotFoundErrorFilter } from "src/shared/filters/error.filter";

@Injectable()
export class TasksService {

    constructor(private readonly databaseService: DatabaseService) { }

    createTask({column_id, name, description}, {req}): Observable<Task> {
        return Observable.create( async observer => {
            const { user_id } = req.authUser;

            const tasks = await this.databaseService.query(observer, `
                INSERT INTO project_tasks(
                name, description, creator_id, column_id)
                VALUES ($1, $2, $3, $4)
                RETURNING task_id, name, description, create_stamp, creator_id as creator, column_id as column
            `, [name, description, user_id, column_id]).pipe(take(1)).toPromise();

            if(!tasks) {
                return observer.complete();
            }

            observer.next(tasks[0]);
            return observer.complete();
            
        });
    }

    updateTask({task_id, name, description}): Observable<Task> {
        return Observable.create( async observer => {
            
            const task = await this.databaseService.query(observer, `
                UPDATE project_tasks
                SET name = $2, description = $3
                WHERE task_id = $1
                RETURNING task_id, name, description, create_stamp, creator_id as creator, column_id as column;
            `, [task_id, name, description]).pipe(take(1)).toPromise();

            if(!task) {
                return observer.complete();
            }

            if(!task.length) {
                return observer.error(new NotFoundErrorFilter('Task not found'));
            }

            observer.next(task[0]);
            return observer.complete();

        });
    }

    deleteTask({task_id}): Observable<Task> {
        return Observable.create( async observer => {

            const task = await this.databaseService.query(observer, `
                DELETE FROM project_tasks
                WHERE task_id = $1
                RETURNING task_id, name, description, create_stamp, creator_id as creator, column_id as column;
            `, [task_id]).pipe(take(1)).toPromise();

            if(!task) {
                return observer.complete();
            }

            if(!task.length) {
                return observer.error(new NotFoundErrorFilter('Task not found'));
            }
            
            observer.next(task[0]);
            return observer.complete();

        });
    }

    moveTask({task_id, column_id}): Observable<Task> {
        return Observable.create( async observer => {

            const task = await this.databaseService.query(observer, `
                UPDATE project_tasks
                SET column_id = $2
                WHERE task_id = $1
                RETURNING task_id, name, description, create_stamp, creator_id as creator, column_id as column;
            `, [task_id, column_id]).pipe(take(1)).toPromise();

            if(!task) {
                return observer.complete();
            }

            if(!task.length) {
                return observer.error(new NotFoundErrorFilter('Task not found'));
            }

            observer.next(task[0]);
            return observer.complete();

        });
    }

}