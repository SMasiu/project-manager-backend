import { ObjectType, Field } from "type-graphql";
import { User } from "src/user/user.model";

@ObjectType()
export class FriendInvitation {
    @Field(type => User)
    from: User;

    @Field(type => User)
    to: User;
}

@ObjectType()
export class Friends {
    @Field(type => User)
    user_1: User;

    @Field(type => User)
    user_2: User;
}