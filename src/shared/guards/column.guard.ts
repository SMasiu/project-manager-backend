import { Injectable, CanActivate } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Observable } from "rxjs";
import { DatabaseService } from "../services/database.service";
import { take } from "rxjs/operators";
import { NotFoundErrorFilter } from "../filters/error.filter";

@Injectable()
export class ColumnGuard implements CanActivate {

    constructor(private readonly databaseService: DatabaseService) { }

    canActivate(context: ExecutionContextHost): Observable<boolean> {
        return Observable.create( async observer => {

            const [_, {project_id, column_id}] = context.getArgs();

            const column = await this.databaseService.query(observer, `
                SELECT column_id
                FROM project_columns
                WHERE column_id = $1 AND project_id = $2
                LIMIT 1;
            `, [column_id, project_id]).pipe(take(1)).toPromise();

            if(!column) {
                return observer.complete();
            }

            if(!column.length) {
                return observer.error(new NotFoundErrorFilter('column not found'));
            }

            observer.next(true);
            return observer.complete();

        });
    }

}