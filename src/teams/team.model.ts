import { Field, ID, ObjectType, Int } from "type-graphql";
import { User } from "src/user/user.model";;

@ObjectType()
export class Team {
    @Field(type => ID)
    team_id: string;

    @Field()
    name: string

    @Field(type => User)
    owner: User;

    @Field(type => Int)
    membersCount: number;
}

@ObjectType()
export class TeamMember {
    @Field(type => User)
    user: User;

    @Field(type => Int)
    permission: number;
}