import { Injectable } from "@nestjs/common";
import { Observable, Observer } from "rxjs";
import { Column } from "./column.model";
import { DatabaseService } from "src/shared/services/database.service";
import { take } from "rxjs/operators";
import { NotFoundErrorFilter } from "src/shared/filters/error.filter";
import { ColumnType } from "./column.type";
import { sameId } from "src/shared/functions/same-id";

@Injectable()
export class ColumnService {

    constructor(private databaseService: DatabaseService) { }

    createColumn({name, project_id}): Observable<Column> {
        return Observable.create( async observer => {

            const pos = await this.databaseService.query(observer, `
                SELECT position, column_id
                FROM project_columns
                WHERE project_id = $1
                ORDER BY position DESC
                LIMIT 1
            `, [project_id]).pipe(take(1)).toPromise();

            if(!pos) {
                return observer.complete();
            }

            let position = 0;

            if(pos.length) {
                position = pos[0].position + 1;
            }

            const column = await this.databaseService.query(observer, `
                INSERT INTO project_columns
                (name, project_id, position)
                VALUES 
                    ($1, $2, $3)
                RETURNING column_id, name, project_id as project, position;
            `, [name, project_id, position]).pipe(take(1)).toPromise();

            if(!column) {
                return observer.complete();
            }
            
            observer.next(column[0]);
            return observer.complete();

        });
    }

    deleteColumn({column_id, project_id}): Observable<Column> {
        return Observable.create( async observer => {

            const columns = await this.databaseService.query(observer, `
                DELETE FROM project_columns
                WHERE column_id = $1 AND project_id = $2
                RETURNING column_id, name, position, project_id as project
            `, [column_id, project_id]).pipe(take(1)).toPromise();

            if(!columns) {
                return observer.complete();
            }

            if(!columns.length) {
                return observer.error(new NotFoundErrorFilter('Column not found'));
            }

            const pos = await this.databaseService.query(observer, `
                UPDATE project_columns pc
                SET position = (
                    SELECT position - 1
                    FROM project_columns p
                    WHERE pc.column_id = p.column_id
                )
                WHERE position > $1 AND project_id = $2;
            `, [columns[0].position, project_id]).pipe(take(1)).toPromise();

            if(!pos) {
                return observer.complete();
            }

            observer.next(columns[0]);
            return observer.complete();

        });
    }

    updateColumn({name, column_id, project_id}): Observable<Column> {
        return Observable.create( async observer => {

            const columns = await this.databaseService.query(observer, `
                UPDATE project_columns
                SET name = $1
                WHERE project_id = $2 AND column_id = $3
                RETURNING project_id as project, column_id, name, position;
            `, [name, project_id, column_id]).pipe(take(1)).toPromise();

            if(!columns) {
                return observer.complete();
            }

            if(!columns.length) {
                return observer.error(new NotFoundErrorFilter('Column not found'));
            }

            observer.next(columns[0]);
            return observer.complete();

        });
    }

    changeColumnPosition({position, column_id, project_id}): Observable<Column[]> {
        return Observable.create( async observer => {

            const columns = await this.getAllColumnsByProjectId(observer, project_id).pipe(take(1)).toPromise();

            if(!columns) {
                return observer.complete();
            }

            const index = columns.findIndex( c => sameId(c.column_id, column_id) )
            const column = {...columns[index]};
            columns.splice(index, 1);
            
            column.position = position;

            const cols = columns.map( c => {
                c.position = c.position + .5;
                return c;
            });

            cols.push(column);
            cols.sort((a, b) => a.position > b.position ? 1 : -1);
            
            let p = 0;
            cols.map( c => {
                c.position = p;
                p++;
                return c
            });

            let res: Column[] = [];

            for(let c of cols) {
                const col = await this.databaseService.query(observer, `
                    UPDATE project_columns
                    SET position = $1
                    WHERE column_id = $2 AND project_id = $3
                    RETURNING column_id, position, name, project_id as project;
                `,[c.position, c.column_id, project_id]).pipe(take(1)).toPromise();

                if(!col) {
                    return observer.complete();
                }
                
                res.push(col[0]);
            };

            if(!res.length) {
                return observer.error('Column not found');
            }
            
            observer.next(res);
            return observer.complete();
        });
    }

    getAllColumnsByProjectId(obs: Observer<any>, project_id: string): Observable<ColumnType[]> {
        return Observable.create( async observer => {

            const columns = await this.databaseService.query(obs, `
                SELECT column_id, name, position, project_id
                FROM project_columns
                WHERE project_id = $1
                ORDER BY position
            `, [project_id]).pipe(take(1)).toPromise();

            if(!columns) {
                obs.error(new NotFoundErrorFilter('Columns not found'));
                observer.next(false);
                return observer.complete();
            }

            observer.next(columns);
            return observer.complete();

        });
    }

    getMappedAllColumns(project_id: string): Observable<Column> {
        return Observable.create( async observer => {
            
            const columns = await this.getAllColumnsByProjectId(observer, project_id).pipe(take(1)).toPromise();

            if(!columns) {
                observer.complete();
            }

            observer.next(columns.map( c => ({
                column_id: c.column_id,
                name: c.name,
                position: c.position,
                project: c.project_id
            })));
            return observer.complete();

        });
    }

    getColumnById(column_id: string): Observable<Column> {
        return Observable.create( async observer => {
            
            const columns = await this.databaseService.query(observer, `
                SELECT name, column_id, position, project_id as project
                FROM project_columns
                WHERE column_id = $1
                LIMIT 1;
            `, [column_id]).pipe(take(1)).toPromise();

            if(!columns) {
                return observer.complete();
            }

            if(!columns.length) {
                return observer.error(new NotFoundErrorFilter('Column not found'))
            }

            observer.next(columns[0]);
            return observer.complete();
        
        });
    }

}