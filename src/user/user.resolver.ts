import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { Me, User } from "./user.model";
import { UserService } from "./user.service";
import { NewUserArgs } from "./user.args";
import { take } from "rxjs/operators";

@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) { }

    @Query(type => String)
    async User(@Context() ctx) {
        const cookie = ctx.req.headers;
        console.log(cookie)
        return 'ok';
    }

    @Query(type => [User])
    async Users() {

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