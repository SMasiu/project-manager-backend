import { ArgsType, Field, ID } from "type-graphql";

@ArgsType()
export class InviteFriendArgs {
    @Field(type => ID)
    user_id: string;
}

@ArgsType()
export class FriendIdArgs {
    @Field(type => ID)
    user_id: string;
}