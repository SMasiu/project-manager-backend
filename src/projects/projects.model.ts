import { ObjectType, Field, ID } from "type-graphql";
import { User } from "src/user/user.model";
import { Team } from "src/teams/team.model";

@ObjectType()
export class Project {
    @Field(type => ID)
    project_id: string;

    @Field(type => String)
    name: string;

    @Field(type => String)
    description: string;

    @Field(type => Boolean)
    open: boolean;

    @Field(type => String)
    owner_type: boolean;

    @Field(type => User)
    creator: User;

    @Field(type => Team, {nullable: true})
    team: Team;
}