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

    private teamsTable = this.createTable('teams', `
        team_id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        owner INTEGER references users(user_id) NOT NULL
    `)

    private teamMembersTable = this.createTable('team_members', `
        team_id INTEGER references teams(team_id) NOT NULL,
        user_id INTEGER references users(user_id) NOT NULL,
        permission INTEGER NOT NULL
    `)

    private createTable(name: string, fields: string) {
        return `
            CREATE TABLE IF NOT EXISTS ${name} (
                ${fields}
            );
        `
    }

    migrate() {
        return concat(
            db.client.query(this.usersTable),
            db.client.query(this.teamsTable),
            db.client.query(this.teamMembersTable)
        )
    }

}

export default Migration;