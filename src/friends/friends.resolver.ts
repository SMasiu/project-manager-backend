import { Resolver, Mutation, Args, Context, Query } from "@nestjs/graphql";
import { FriendsService } from "./friends.service";
import { AllFriends } from "./friends.model";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { InviteFriendArgs, FriendIdArgs } from "./friends.args";
import { take, retry } from "rxjs/operators";
import { User } from "src/user/user.model";

@Resolver()
export class FriendsResolver {

    constructor(private friendsService: FriendsService) { }

    @Mutation(type => User)
    @UseGuards(AuthGuard)
    async InviteFriend(@Args() args: InviteFriendArgs, @Context() ctx) {
        try {
            return await this.friendsService.inviteFriend(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => User)
    @UseGuards(AuthGuard)
    async RejectFriendInvitation(@Args() args: FriendIdArgs, @Context() ctx) {
        try {
            return await this.friendsService.rejectInvitation(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => User)
    @UseGuards(AuthGuard)
    async AcceptFriendInvitation(@Args() args: FriendIdArgs, @Context() ctx) {
        try {
            return await this.friendsService.acceptInvitation(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => User)
    @UseGuards(AuthGuard)
    async CancelFriendInvitation(@Args() args: FriendIdArgs, @Context() ctx) {
        try {
            return await this.friendsService.cancelInvitation(args, ctx).pipe(take(1)).toPromise();
        } catch  (err) {
            throw err;
        }
    }

    @Query(type => [User])
    @UseGuards(AuthGuard)
    async GetFriends(@Context() ctx) {
        try {
            return await this.friendsService.getMyFriends(ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => [User])
    @UseGuards(AuthGuard)
    async GetInvitedFriends(@Context() ctx) {
        try {
            return await this.friendsService.getInvitedFriends(ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => AllFriends)
    @UseGuards(AuthGuard)
    async GetAllFriends(@Context() ctx) {
        try {

            const [my, invited] = await Promise.all([
                this.friendsService.getMyFriends(ctx).pipe(take(1)).toPromise(),
                this.friendsService.getInvitedFriends(ctx).pipe(take(1)).toPromise()
            ]);

            return ({
                my,
                invited 
            })

        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => User)
    @UseGuards(AuthGuard)
    async DeleteFriend(@Args() args: FriendIdArgs, @Context() ctx) {
        try {
            return await this.friendsService.deleteFriend(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

}