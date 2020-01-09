import { Resolver, Query, Mutation } from "@nestjs/graphql";
import { User } from "./user.model";
import { UserService } from "./user.service";

@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) { }

    @Query(type => User)
    async User() {
        
    }

    @Query(type => [User])
    async Users() {

    }

    @Mutation(type => User) 
    async CreateUser() {
        return await this.userService.createUser();
    }

}