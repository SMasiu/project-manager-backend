import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { Me, User } from "./user.model";
import { UserService } from "./user.service";
import { NewUserArgs } from "./user.args";
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

    @Mutation(type => Me) 
    async CreateUser(@Args() user: NewUserArgs, @Context() ctx) {
        try {
            return await this.userService.createUser(user).pipe(take(1)).toPromise();
        } catch (err) {
            throw err;
        }
    }

}