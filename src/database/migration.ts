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

    private friendsInvitationTable = this.createTable('friends_invitations', `
        from_id INTEGER references users(user_id) NOT NULL,
        to_id INTEGER references users(user_id) NOT NULL
    `)

    private friendsTable = this.createTable('friends', `
        user_id_1 INTEGER references users(user_id) NOT NULL,
        user_id_2 INTEGER references users(user_id) NOT NULL
    `)

    private projectsTable = this.createTable('projects', `
        project_id SERIAL PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        description VARCHAR(500) NOT NULL,
        open BOOLEAN NOT NULL,
        owner_type VARCHAR(5) NOT NULL,
        creator_id INTEGER references users(user_id) NOT NULL,
        team_id INTEGER references teams(team_id)
    `)

    private projectColumnsTable = this.createTable('project_columns', `
        column_id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        position INTEGER NOT NULL,
        project_id INTEGER references projects(project_id) ON DELETE CASCADE NOT NULL
    `)

    private projectTaskTable = this.createTable('project_tasks', `
        task_id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description VARCHAR(5000),
        create_stamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        creator_id INTEGER references users(user_id) NOT NULL,
        column_id INTEGER references project_columns(column_id) ON DELETE CASCADE NOT NULL
    `)

    private taskUsersTable = this.createTable('task_users', `
        task_id INTEGER references project_tasks(task_id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER references users(user_id) NOT NULL 
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
            db.client.query(this.teamMembersTable),
            db.client.query(this.friendsInvitationTable),
            db.client.query(this.friendsTable),
            db.client.query(this.projectsTable),
            db.client.query(this.projectColumnsTable),
            db.client.query(this.projectTaskTable),
            db.client.query(this.taskUsersTable)
        )
    }

}

export default Migration;