import { Resolver, Query, Context } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { NotificationService } from "./notification.service";
import { take } from "rxjs/operators";
import { Notifications } from "./notification.model";

@Resolver()
export class NotificationResolver {

    constructor(private readonly notificationService: NotificationService) {

    }

    @Query(type => Notifications)
    @UseGuards(AuthGuard)
    async GetNotifications(@Context() ctx) {
        return await this.notificationService.getNotifications(ctx).pipe(take(1)).toPromise();
    }

}