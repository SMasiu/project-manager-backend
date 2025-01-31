import { Module } from "@nestjs/common";
import { ProjectsResolver } from "./projects.resolver";
import { ProjectsService } from "./projects.service";
import { AuthService } from "src/shared/services/auth.service";
import { DatabaseService } from "src/shared/services/database.service";
import { CookieService } from "src/shared/services/cookie.service";
import { TeamService } from "src/teams/team.service";
import { ColumnService } from "src/project-columns/column.service";

@Module({
    providers: [
        ProjectsResolver,
        ProjectsService,
        AuthService,
        DatabaseService,
        CookieService,
        TeamService,
        ColumnService
    ]
})
export class ProjectsModule { }