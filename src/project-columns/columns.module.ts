import { Module } from "@nestjs/common";
import { DatabaseService } from "src/shared/services/database.service";
import { AuthService } from "src/shared/services/auth.service";
import { CookieService } from "src/shared/services/cookie.service";
import { ColumnResolver } from "./column.resolver";
import { ColumnService } from "./column.service";
import { ProjectsService } from "src/projects/projects.service";

@Module({
    providers: [
        DatabaseService,
        AuthService,
        CookieService,
        ColumnResolver,
        ColumnService,
        ProjectsService
    ]
})
export class ColumnModule { }