import { ObjectType, Field } from "type-graphql";
import { User } from "src/user/user.model";

@ObjectType()
export class AllFriends {
    @Field(type => [User])
    my: User[];

    @Field(type => [User])
    invited: User[]
}