import { Module } from "@nestjs/common";
import { TeamResolver } from "./team.resolver";
import { TeamService } from "./team.service";
import { AuthService } from "src/shared/services/auth.service";
import { CookieService } from "src/shared/services/cookie.service";
import { DatabaseService } from "src/shared/services/database.service";

@Module({
    providers: [
        TeamResolver,
        TeamService,
        AuthService,
        CookieService,
        DatabaseService
    ]
})
export class TeamModule { }