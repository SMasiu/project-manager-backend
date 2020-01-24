import { ObjectType, Field } from "type-graphql";
import { User } from "src/user/user.model";

@ObjectType()
export class FriendInvitation {
    @Field(type => User)
    from: User;

    @Field(type => User)
    to: User;
}
