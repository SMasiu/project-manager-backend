import { Module } from "@nestjs/common";
import { DatabaseService } from "src/shared/services/database.service";
import { AuthService } from "src/shared/services/auth.service";
import { CookieService } from "src/shared/services/cookie.service";
import { ColumnResolver } from "./column.resolver";
import { ColumnService } from "./column.service";
import { ProjectsService } from "src/projects/projects.service";
import { TasksService } from "src/tasks/tasks.service";
import { TaskUsersService } from "src/task-users/task-users.service";

@Module({
    providers: [
        DatabaseService,
        AuthService,
        CookieService,
        ColumnResolver,
        ColumnService,
        ProjectsService,
        TasksService,
        TaskUsersService
    ]
})
export class ColumnModule { }