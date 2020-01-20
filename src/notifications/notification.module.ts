import { Module } from "@nestjs/common";
import { NotificationResolver } from "./notification.resolver";
import { AuthService } from "src/shared/services/auth.service";
import { CookieService } from "src/shared/services/cookie.service";
import { NotificationService } from "./notification.service";
import { DatabaseService } from "src/shared/services/database.service";

@Module({
    providers: [
        NotificationResolver,
        AuthService,
        CookieService,
        NotificationService,
        DatabaseService
    ]
})
export class NotificationModule { }