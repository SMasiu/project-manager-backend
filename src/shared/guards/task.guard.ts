import { Injectable, CanActivate } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Observable } from "rxjs";
import { DatabaseService } from "../services/database.service";
import { take } from "rxjs/operators";
import { NotFoundErrorFilter } from "../filters/error.filter";

@Injectable()
export class TaskGuard implements CanActivate {
    
    constructor(private readonly databaseService: DatabaseService) { }

    canActivate(context: ExecutionContextHost): Observable<boolean> {
        return Observable.create( async observer => {

            const [_, {project_id, task_id}] = context.getArgs();  

            const task = await this.databaseService.query(observer, `
                SELECT task_id
                FROM project_tasks
                JOIN project_columns USING(column_id)
                JOIN projects USING(project_id)
                WHERE task_id = $1 AND project_id = $2
                LIMIT 1;
            `, [task_id, project_id]).pipe(take(1)).toPromise();

            if(!task) {
                return observer.complete();
            }

            if(!task.length) {
                return observer.error(new NotFoundErrorFilter('Task not found'));
            }

            observer.next(true);
            return observer.complete();

        });
    }

}