import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Team {
    @Field(type => ID)
    team_id: number;

    @Field()
    name: string

    @Field(type => ID)
    owner: string;
}

@ObjectType()
export class TeamMember {
    @Field(type => ID)
    user_id: string;

    @Field(type => ID)
    team_id: string;

    @Field()
    permission: number;
}