import { Module } from "@nestjs/common";
import { TaskResolver } from "./tasks.resolver";
import { TasksService } from "./tasks.service";
import { DatabaseService } from "src/shared/services/database.service";
import { AuthService } from "src/shared/services/auth.service";
import { CookieService } from "src/shared/services/cookie.service";
import { DateScalar } from "src/graphql/scalars/date.scalar";
import { UserService } from "src/user/user.service";
import { ColumnService } from "src/project-columns/column.service";

@Module({
    providers: [
        TaskResolver,
        TasksService,
        DatabaseService,
        AuthService,
        CookieService,
        DateScalar,
        UserService,
        ColumnService
    ]
})
export class TasksModule { }