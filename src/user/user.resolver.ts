import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { Me, User } from "./user.model";
import { UserService } from "./user.service";
import { NewUserArgs, LoginUserArgs } from "./user.args";
import { take } from "rxjs/operators";

@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) { }

    @Query(type => User)
    async User() {
        
    }

    @Query(type => [User])
    async Users() {

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

}