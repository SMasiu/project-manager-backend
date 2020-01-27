import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { Me, User, MeStatus, UsersAndCount } from "./user.model";
import { UserService } from "./user.service";
import { NewUserArgs, LoginUserArgs, UserArgs, GetUserArgs } from "./user.args";
import { take } from "rxjs/operators";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/shared/guards/auth.guard";
import { Int } from "type-graphql";

@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) { }

    @Query(type => User)
    @UseGuards(AuthGuard)
    async User(@Args() userArgs: UserArgs) {
        try {
            return await this.userService.getUser(userArgs.id).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => [User])
    @UseGuards(AuthGuard)
    async Users(@Args() args: GetUserArgs, @Context() ctx) {
        try {
            return await this.userService.getUsers(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => Int)
    @UseGuards(AuthGuard)
    async UsersCount(@Args() args: GetUserArgs, @Context() ctx) {
        try {
            return await this.userService.getUsersCount(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => UsersAndCount)
    @UseGuards(AuthGuard)
    async GetUsersAndCount(@Args() args: GetUserArgs, @Context() ctx) {
        try {
            
            const users = await this.userService.getUsers(args, ctx).pipe(take(1)).toPromise();
            const count = await this.userService.getUsersCount(args, ctx).pipe(take(1)).toPromise();
    
            return {
                users,
                count
            }

        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => String)
    async LogoutUser(@Context() ctx) {
        try {
            return await this.userService.logoutUser(ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Me)
    async LoginUser(@Args() args: LoginUserArgs, @Context() ctx) {
        try {
            return await this.userService.loginUser(args, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Mutation(type => Me) 
    async CreateUser(@Args() user: NewUserArgs, @Context() ctx) {
        try {
            return await this.userService.createUser(user, ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

    @Query(type => MeStatus)
    async CheckUserStatus(@Context() ctx) {
        try {
            return await this.userService.checkUserStatus(ctx).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

}