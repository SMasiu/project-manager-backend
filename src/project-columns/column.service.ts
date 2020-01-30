import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { Column } from "./column.model";
import { DatabaseService } from "src/shared/services/database.service";
import { take } from "rxjs/operators";

@Injectable()
export class ColumnService {

    constructor(private databaseService: DatabaseService) { }

    createColumn({name, project_id}): Observable<Column> {
        return Observable.create( async observer => {

            const column = await this.databaseService.query(observer, `
                INSERT INTO project_columns
                (name, project_id, position)
                VALUES 
                    (
                        $1,
                        $2, 
                        CAST (
                            CASE WHEN EXISTS ( 
                                SELECT project_id
                                FROM project_columns
                                WHERE project_id = 2
                                LIMIT 1
                            ) 
                            THEN (
                                SELECT position + 1
                                FROM project_columns
                                WHERE project_id = 2
                                ORDER BY position DESC
                                LIMIT 1
                            )
                            ELSE 0 
                            END AS INT
                        )  
                    )
                RETURNING column_id, name, project_id as project, position;
            `, [name, project_id]).pipe(take(1)).toPromise();

            if(!column) {
                return observer.complete();
            }
            
            observer.next(column[0]);
            return observer.complete();

        });
    }

}