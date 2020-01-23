import { Resolver, Mutation, Args, Context } from "@nestjs/graphql";
import { FriendsService } from "./friends.service";
import { FriendInvitation } from "./friends.model";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { InviteFriendArgs } from "./friends.args";
import { take } from "rxjs/operators";

@Resolver()
export class FriendsResolver {

    constructor(private friendsService: FriendsService) { }

    @Mutation(type => FriendInvitation)
    @UseGuards(AuthGuard)
    async InviteFriend(@Args() args: InviteFriendArgs, @Context() ctx) {
        try {
            return await this.friendsService.inviteFriend(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

}