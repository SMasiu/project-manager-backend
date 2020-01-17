import { Client } from "pg";
import db from "src/database/client";
import { Injectable } from "@nestjs/common";
import { from, of, Observable } from "rxjs";
import { take, map, catchError } from "rxjs/operators";
import { ServerErrorFilter } from "../filters/error.filter";

@Injectable()
export class DatabaseService {
    
    client: Client;

    constructor() {
        this.client = db.client;
    }

    query(sql: string, args: any[] | null = null): Observable<any[]> {
        return Observable.create(observer => {
            from(this.client.query(sql, args)).pipe(
                take(1),
                map( r => r.rows ),
                catchError( err => {
                    console.log(err)
                    return of('error')
                })
            ).subscribe(rows => {
                if(rows === 'error') {
                    observer.error(new ServerErrorFilter())
                } else {
                    observer.next(rows);
                    observer.complete();
                }
            });
        });
    }

    queryMany(queries: {sql: string, args?: any[]}[]): Observable<any[]> {
        return Observable.create(observer => {
            let queryAll = queries.map( ({sql, args}) => this.client.query(sql, args));

            from(Promise.all(queryAll)).pipe(
                take(1),
                map( res => res.map(r => r.rows)),
                catchError( err => {
                    console.log(err)
                    return of('error')
                } )
            ).subscribe(rows => {
               if(rows === 'error') {
                   observer.error(new ServerErrorFilter());
               } else {
                   observer.next(rows);
                   observer.complete();
               }
            });

        });

    }

}