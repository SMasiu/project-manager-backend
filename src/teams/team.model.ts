import { Field, ID, ObjectType, Int } from "type-graphql";
import { User } from "src/user/user.model";;

@ObjectType()
class TeamBase {
    @Field(type => ID)
    team_id: string;

    @Field()
    name: string
}

@ObjectType()
export class Team extends TeamBase {
    @Field(type => ID)
    owner: string;
}

@ObjectType()
export class TeamExtended extends TeamBase {
    @Field(type => User)
    owner: User;

    @Field(type => Int)
    membersCount: number;
}

@ObjectType()
export class TeamMember {
    @Field(type => ID)
    user_id: string;

    @Field(type => ID)
    team_id: string;

    @Field(type => Int)
    permission: number;
}