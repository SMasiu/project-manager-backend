import { Module } from "@nestjs/common";
import { FriendsResolver } from "./friends.resolver";
import { FriendsService } from "./friends.service";
import { DatabaseService } from "src/shared/services/database.service";
import { AuthService } from "src/shared/services/auth.service";
import { CookieService } from "src/shared/services/cookie.service";

@Module({
    providers: [
        FriendsResolver,
        FriendsService,
        DatabaseService,
        AuthService,
        CookieService
    ]
})
export class FriendsModule { }