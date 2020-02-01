import { Module } from "@nestjs/common";
import { TaskUsersResolver } from "./task-users.resolver";
import { TaskUsersService } from "./task-users.service";
import { AuthService } from "src/shared/services/auth.service";
import { DatabaseService } from "src/shared/services/database.service";
import { CookieService } from "src/shared/services/cookie.service";

@Module({
    providers: [
        TaskUsersResolver,
        TaskUsersService,
        AuthService,
        DatabaseService,
        CookieService
    ]
})
export class TaskUsersModule { }