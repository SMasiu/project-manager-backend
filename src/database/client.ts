import { Client } from 'pg';
import { Observable } from 'rxjs';

class DatabaseClient {

    client: Client;

    connect(): Observable<boolean> {
        return Observable.create( (observer => {
            const { DB_NAME, DB_HOST, DB_PASSWORD, DB_USER } = process.env;

            this.client = new Client({
                host: DB_HOST,
                user: DB_USER,
                password: DB_PASSWORD,
                database: DB_NAME,
            });

            this.client.connect()
                .then( () => {
                    observer.next(true)
                    observer.complete();
                })
                .catch( err => {
                    observer.error(err);
                    observer.complete();
                });
        
        }));
    }

}

const db = new DatabaseClient();

export default db;