import { forkJoin, concat } from "rxjs";
import db from "./client";

class Migration {

    private usersTable = this.createTable('users', `
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(320) NOT NULL UNIQUE,
        nick VARCHAR(30) NOT NULL UNIQUE,
        password VARCHAR NOT NULL,
        name VARCHAR(20) NOT NULL,
        surname VARCHAR(30) NOT NULL
    `);

    private createTable(name: string, fields: string) {
        return `
            CREATE TABLE IF NOT EXISTS ${name} (
                ${fields}
            );
        `
    }

    migrate() {
        return concat(
            db.client.query(this.usersTable)
        )
    }

}

export default Migration;